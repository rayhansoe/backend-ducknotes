const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

const User = require('../models/userModel')
const Device = require('../models/deviceModel')
const { buildTokens, setTokens } = require('../utils/token-utils')

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

	// Create User || tambah device populate
	const user = await User.create({
		name,
		email,
		username,
		password: hashedPassword,
	})

	// check if create user fail.
	if (!user) {
		res.status(400)
		throw new Error('Invalid user data.')
	}

	try {
		// collect user device from request header
		const userAgent = req.headers['user-agent'].toString()

		// build tokens
		const { accessToken, refreshToken } = buildTokens(user._id)

		// find existing user device or create a new one.
		const device = await Device.create({
			device: userAgent,
			user: user._id,
			token: refreshToken,
		})

		// if device fail.
		if (!device) {
			res.status(401)
			throw new Error('Unauthorized: Invalid Credentials.')
		}

		// save data
		user.devices.push(device)
		await user.save()

		// set tokens
		setTokens(res, accessToken, refreshToken)

		// set status code
		res.status(201)

		// set response json
		res.json({
			accessToken,
			userProfile: {
				_id: user._id,
				username: user.username,
				name: user.name,
			},
		})
	} catch (error) {
		// if failed to find or load the loan data.
		res.status(424)
		throw new Error('Failed to load this loan data.')
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
	if (!user || !bcrypt.compare(password, user.password)) {
		res.status(401)
		throw new Error('Unauthorized: Invalid Credentials.')
	}

	try {
		// collect user device from request headers
		const userAgent = req.headers['user-agent'].toString()

		// collect user data
		const { _id, username, name } = user
		const userDevices = await User.findById(_id).populate('devices').lean()

		// if user devices limit.
		if (userDevices && userDevices > 5) {
			res.status(401)
			throw new Error('Your Devices is limit. Logout or tell admin.')
		}

		// build tokens
		const { accessToken, refreshToken } = buildTokens(user._id)

		// create a new one or find saved device
		const device =
			(await Device.findOne({ device: userAgent, user: _id })) ||
			(await Device.create({
				device: userAgent,
				user: _id,
				token: refreshToken,
			}))

		// check device
		if (!device) {
			res.status(401)
			throw new Error('Unauthorized: Invalid Credentials.')
		}

		// save user
		const isSaved = userDevices.devices.find((d) => `${d._id}` === `${device._id}`)
		if (!isSaved) {
			user.devices.push(device._id)
			await user.save()
		}

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
		// if failed to find or load the loan data.
		res.status(424)
		throw new Error('Failed to load this loan data.')
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
	const newDevice = user.devices.filter((id) => JSON.stringify(id) !== JSON.stringify(device._id))
	user.devices = newDevice
	await user.save()
	await device.remove()

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
	checkUser,
	// getUsers,
	// getUserProfile,
	logout,
	handleRefreshToken,
}
