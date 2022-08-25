const moment = require('moment')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

const User = require('../models/userModel')
const Device = require('../models/deviceModel')
const Confirmation = require('../models/confirmModel')

const { sendLog } = require('../utils/discord-utils')
const { getGitHubUser } = require('../api/github-adapter')
const { buildTokens, setTokens } = require('../utils/token-utils')
const {
	buildCode,
	sendConfirmationEmail,
	sendCreateAccoutInfo,
	sendLoginAccoutInfo,
} = require('../utils/email-utils')
const {
	getUserByGitHubId,
	createUser,
	getUserByGitHubEmail,
	checkUserDevices,
	findOrCreateDevice,
	getUserByGoogleId,
	getUserByGoogleEmail,
	createDummies,
} = require('../utils/user-utils')
const { getGoogleUser } = require('../api/google-adapter')

// @desc Create Dummy User
// @route POST /api/users/create-dummies
// @access DEV ONLY
const createUserDummies = asyncHandler(async (req, res) => {
	try {
		await createDummies(5)
		res.status(201)
		res.json({
			message: 'create dummy account success',
		})
	} catch (error) {
		console.log(error)
		res.status(424)
		throw new Error('Failed to load this user data.')
	}
})

// @desc Use Dummy Account
// @route POST /api/users/use-dummy
// @access PUBLIC
const useDummy = asyncHandler(async (req, res) => {
	const users = await User.find({ isDummy: true })

	const user = users[Math.floor(Math.random() * users.length)]

	try {
		// collect user device from request headers
		const userAgent = req.headers['user-agent'].toString()

		// collect user data
		const { _id, username, name } = user

		// build tokens
		const { accessToken, refreshToken } = buildTokens(user._id)

		// check user devices
		await checkUserDevices(res, _id)

		// find or create user device
		const device = await findOrCreateDevice(res, userAgent, _id, refreshToken)

		// log discord
		sendLog(`This Dummy account is logged in. ID: ${user.id}`)

		// set tokens
		setTokens(res, accessToken, device.token)

		// set status code
		res.status(201)

		// set response json
		res.json({
			accessToken,
			userProfile: {
				_id,
				username,
				name,
			},
		})
	} catch (error) {
		// if failed to find or load the User data.
		console.log(error)
		res.status(424)
		throw new Error('Failed to load this data.')
	}
})

// @desc Register User
// @route POST /api/users
// @access PUBLIC
const registerUser = asyncHandler(async (req, res) => {
	// get data from client
	const { name, email, password, username } = req.body

	// check the fields
	if (!name || !email || !password || !username) {
		res.status(400)
		throw new Error('Please add all fields.')
	}

	// check user exists
	const userExistByEmail = await User.findOne({ email })
	const userExistByUsername = await User.findOne({ username })

	// check by email & username
	if (userExistByEmail && userExistByUsername) {
		res.status(409)
		throw new Error('Username & Email already taken.')
	}

	// by username
	if (userExistByUsername) {
		res.status(409)
		throw new Error('Username already taken.')
	}

	// by email
	if (userExistByEmail) {
		res.status(409)
		throw new Error('Email already taken.')
	}

	// Hash Password
	const salt = await bcrypt.genSalt(10)
	const hashedPassword = await bcrypt.hash(password, salt)

	try {
		// Create User || tambah device populate
		const user = await User.create({
			name: req.body?.name,
			email: req.body?.email,
			username: req.body?.username,
			password: hashedPassword,
		})

		// check if create user fail.
		if (!user) {
			res.status(400)
			throw new Error('Invalid user data.')
		}

		// collect user device from request header
		const userAgent = req.headers['user-agent'].toString()

		// data user
		const { _id, username, name } = user

		// build tokens
		const { accessToken, refreshToken } = buildTokens(_id)

		// find or create user device
		await findOrCreateDevice(res, userAgent, _id, refreshToken)

		// info user by email
		sendCreateAccoutInfo(user.name, user.email)

		// log discord
		sendLog(`New account has been created. ID: ${user.id}`)

		// set tokens
		setTokens(res, accessToken, refreshToken)

		// set status code
		res.status(201)

		// set response json
		res.json({
			accessToken,
			userProfile: {
				_id,
				username,
				name,
			},
		})
	} catch (error) {
		// if failed to find or load the User data.
		console.log(error)
		res.status(424)
		throw new Error('Failed to load this user data.')
	}
})

// @desc OAuth with Google
// @route POST /api/users/google
// @access PUBLIC
const googleHandler = asyncHandler(async (req, res) => {
	const { code } = req.query

	// if there is no code
	if (!code) {
		res.status(401)
		throw new Error('Unauthorized: Invalid Credentials.')
	}

	try {
		// collect user device from request headers
		const userAgent = req.headers['user-agent'].toString()

		// get GitHub user from code
		const googleUser = await getGoogleUser(code)

		// find saved user by id or email
		let user = await getUserByGoogleId(googleUser.id)
		if (!user && googleUser.email) user = await getUserByGoogleEmail(googleUser)

		// if there is no saved user
		if (!user) {
			user = await createUser({
				name: googleUser.name,
				email: googleUser.email,
				username: googleUser.given_name,
				googleUserId: googleUser.id,
				avatar: googleUser.picture,
				status: 'Active',
			})
		}

		// data user
		const { _id, username, name } = user

		// build tokens
		const { accessToken, refreshToken } = buildTokens(user._id)

		// check user devices
		await checkUserDevices(res, _id)

		// find or create user device
		const device = await findOrCreateDevice(res, userAgent, _id, refreshToken)

		// log discord
		sendLog(`This account is logged in by Google service. ID: ${user.id}`)

		// set tokens
		setTokens(res, accessToken, device.token)

		// set status code
		res.status(201)

		// set response json
		res.json({
			accessToken,
			userProfile: {
				_id,
				username,
				name,
			},
		})
	} catch (error) {
		// if failed to find or load the User data.
		console.log(error)
		res.status(424)
		throw new Error('Failed to load this data.')
	}
})

// @desc OAuth with GitHub
// @route POST /api/users/github
// @access PUBLIC
const OAuthGitHub = asyncHandler(async (req, res) => {
	// collect code from auth
	const { code } = req.query

	// if there is no code
	if (!code) {
		res.status(401)
		throw new Error('Unauthorized: Invalid Credentials.')
	}

	try {
		// collect user device from request headers
		const userAgent = req.headers['user-agent'].toString()

		// get GitHub user from code
		const gitHubUser = await getGitHubUser(code)

		// find saved user by id or email
		let user = await getUserByGitHubId(gitHubUser.id)
		if (!user && gitHubUser.email) user = await getUserByGitHubEmail(gitHubUser)

		// if there is no saved user
		if (!user) {
			user = await createUser({
				name: gitHubUser.name,
				username: gitHubUser.login,
				gitHubUserId: gitHubUser.id,
				avatar: gitHubUser.avatar_url,
				status: 'Active',
			})
		}

		// data user
		const { _id, username, name } = user

		// build tokens
		const { accessToken, refreshToken } = buildTokens(user._id)

		// check user devices
		await checkUserDevices(res, _id)

		// find or create user device
		const device = await findOrCreateDevice(res, userAgent, _id, refreshToken)

		// log discord
		sendLog(`This account is logged in by GitHub service. ID: ${user.id}`)

		// set tokens
		setTokens(res, accessToken, device.token)

		// set status code
		res.status(201)

		// set response json
		res.json({
			accessToken,
			userProfile: {
				_id,
				username,
				name,
			},
		})
	} catch (error) {
		// if failed to find or load the User data.
		console.log(error)
		res.status(424)
		throw new Error('Failed to load this data.')
	}
})

// @desc Login User
// @route POST /api/users/login
// @access PUBLIC
const loginUser = asyncHandler(async (req, res) => {
	// get form login from client
	const { text, password } = req.body

	// check user
	let user = await User.findOne({ username: text })
	if (!user) user = await User.findOne({ email: text })

	// check user
	if (!user || !user.password) {
		res.status(401)
		throw new Error('Unauthorized: Invalid Credentials.')
	}

	// check user
	if (!user || (user.password && !bcrypt.compare(password, user?.password))) {
		res.status(401)
		throw new Error('Unauthorized: Invalid Credentials.')
	}

	try {
		// collect user device from request headers
		const userAgent = req.headers['user-agent'].toString()

		// collect user data
		const { _id, username, name } = user

		// build tokens
		const { accessToken, refreshToken } = buildTokens(user._id)

		// check user devices
		await checkUserDevices(res, _id)

		// find or create user device
		const device = await findOrCreateDevice(res, userAgent, _id, refreshToken)

		// send login info to email user
		sendLoginAccoutInfo(user.name, user.email)

		// log discord
		sendLog(`This account is logged in. ID: ${user.id}`)

		// set tokens
		setTokens(res, accessToken, device.token)

		// set status code
		res.status(201)

		// set response json
		res.json({
			accessToken,
			userProfile: {
				_id,
				username,
				name,
			},
		})
	} catch (error) {
		// if failed to find or load the User data.
		console.log(error)
		res.status(424)
		throw new Error('Failed to load this data.')
	}
})

// @desc Resend Email Verification
// @route GET /api/resend/
// @access PRIVATE
const resendEmailVerification = asyncHandler(async (req, res) => {
	const user = req.user

	let savedConfirmationCode = await Confirmation.findOne({ user: user._id })

	if (savedConfirmationCode && savedConfirmationCode.expiredAt > moment(new Date()).toDate()) {
		// set status code
		res.status(200)

		// set response json
		res.json({
			message: 'wait until the cooldown is over',
			cooldown: savedConfirmationCode.expiredAt,
		})

		return
	}

	// if confirmation code is expired
	if (savedConfirmationCode && savedConfirmationCode.expiredAt < moment(new Date()).toDate()) {
		await savedConfirmationCode.delete()
	}

	// confirmation email
	const { confirmationCode, expiredAt } = buildCode(user._id)
	savedConfirmationCode = await Confirmation.create({
		user: user._id,
		confirmationCode,
		expiredAt,
	})
	sendConfirmationEmail(user._id, user.name, user.email, confirmationCode)

	// send discord
	sendLog(`Send Email Verification. ID: ${user.id}`)

	// set status code
	res.status(200)

	// set response json
	res.json({
		message: 'Check your email.',
		cooldown: savedConfirmationCode.expiredAt,
	})
})

// @desc handle Verification Account
// @route POST /api/users/verify
// @access KINDA PRIVATE
const verifyAccount = asyncHandler(async (req, res) => {
	const { id, confirmationCode } = req.params

	const savedConfirmationCode = await Confirmation.findOne({ confirmationCode })

	// if confirmation code is expired
	if (savedConfirmationCode && savedConfirmationCode.expiredAt < moment(new Date()).toDate()) {
		await savedConfirmationCode.delete()
	}

	try {
		const user = await User.findById(id)
		const decoded = jwt.verify(confirmationCode, process.env.CONFIRMATION_CODE_SECRET)

		// if id and confirmation code is not equal
		if (user.id !== decoded.id) {
			res.status(403)
			throw new Error('Who are you!!!')
		}

		// if user is already active
		if (user.isVerified) {
			res.status(200)
			res.json({
				message: 'Your account is already active.',
			})
		}

		// activate the user
		user.isVerified = true
		await user.save()

		// then delete saved confirmation code
		await savedConfirmationCode.delete()

		// log discord
		sendLog(`This account has been verified successfully. ID: ${user.id}`)

		res.status(201)

		res.json({
			message: 'User account activated successfully.',
		})
	} catch (error) {
		console.log(error)
		res.status(403)
		throw new Error('Not Authorized.')
	}
})

// @desc handle Refresh Token
// @route GET /api/users/refreshToken
// @access KINDA PRIVATE
const handleRefreshToken = asyncHandler(async (req, res) => {
	// collect cookies
	const cookies = req.cookies

	// check jwt cookie
	if (!cookies?.refresh) {
		res.sendStatus(401) // Uauthorized
		throw new Error('Unauthorized, no refresh token!')
	}

	// get refresh token from jwt cookie
	const refreshToken = cookies.refresh

	// verif refresh token
	const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)

	try {
		// find user by refresh token
		const user = await User.findById(decoded.id)

		// get user data
		const { _id, username, name } = user

		// build token
		const { accessToken } = buildTokens(user._id)

		// set tokens
		setTokens(res, accessToken, false)

		// send log
		sendLog(`This account is successfully refreshed the access token. ID: ${user.id}`)

		// set code
		res.status(200)

		// set response
		res.json({
			accessToken,
			userProfile: {
				_id,
				username,
				name,
			},
		})
	} catch (error) {
		res.status(403)
		throw new Error('Forbidden: WHO ARE U!!!')
	}
})

// @desc logout user
// @route DELETE /api/users/logout
// @access PRIVATE
const logout = asyncHandler(async (req, res) => {
	// collect user device
	const userAgent = req.headers['user-agent'].toString()

	// collect cookies
	const cookies = req.cookies

	// check jwt in cookies
	if (!cookies?.refresh || !cookies?.access) {
		res.sendStatus(204) // Uauthorized
		throw new Error('No Content')
	}

	// collect refresh token in cookie
	const refreshToken = cookies.refresh

	// user
	const user = req.user

	// find user device
	const device = await Device.findOne({
		device: userAgent,
		user: user._id,
		token: refreshToken,
	})

	// check device and user
	if (!device || !user) {
		res.status(400)
		throw new Error('Device or User not match.')
	}

	// remove target user device
	await device.remove()

	// send log
	sendLog(`This account is successfully logged out. ID: ${user.id}`)

	// clear tokens cookie
	res.clearCookie('refresh', { httpOnly: true, sameSite: 'None', secure: true })
	res.clearCookie('access', { httpOnly: true, sameSite: 'None', secure: true })

	// set response
	res.json({
		message: `Success Logout.`,
	})

	// set status code
	res.status(204)
})

// @desc logout all user
// @route DELETE /api/users/logout
// @access PRIVATE
const logoutAll = asyncHandler(async (req, res) => {
	// collect user device
	const userAgent = req.headers['user-agent'].toString()

	// collect cookies
	const cookies = req.cookies

	// check jwt in cookies
	if (!cookies?.refresh || !cookies?.access) {
		res.sendStatus(204) // Uauthorized
		throw new Error('No Content')
	}

	// collect refresh token in cookie
	const refreshToken = cookies.refresh

	// user
	const user = req.user

	// find user device
	const device = await Device.findOne({
		device: userAgent,
		user: user._id,
		token: refreshToken,
	})

	// check device and user
	if (!device || !user) {
		res.status(400)
		throw new Error('Device or User not match.')
	}

	// remove target user device and all devices
	await device.remove()
	await Device.deleteMany()

	// send log
	sendLog(`Log out all is successfully succeed by DEV. DEV: ${user.id}`)

	// clear tokens cookie
	res.clearCookie('refresh', { httpOnly: true, sameSite: 'None', secure: true })
	res.clearCookie('access', { httpOnly: true, sameSite: 'None', secure: true })

	// set response
	res.json({
		message: `Success Logout.`,
	})

	// set status code
	res.status(204)
})

module.exports = {
	registerUser,
	loginUser,
	OAuthGitHub,
	googleHandler,
	verifyAccount,
	resendEmailVerification,
	handleRefreshToken,
	logout,
	logoutAll,
	createUserDummies,
	useDummy,
}
