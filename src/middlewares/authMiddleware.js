const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const Device = require('../models/deviceModel')

const protect = asyncHandler(async (req, res, next) => {
	let token

	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		try {
			// Get Token from header
			token = req.headers.authorization.split(' ')[1]

			// verify
			// verify
			const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
			const decodedRT = jwt.verify(req.cookies?.refresh, process.env.REFRESH_TOKEN_SECRET)

			// Get User from the Token / User yang login, bukan user yang mau dilihat.
			req.user = await User.findById(decoded.id).select('-password')

			// collect user device from client
			const userAgent = req.headers['user-agent'].toString()

			// find saved user device
			const userDevice = await Device.findOne({
				device: userAgent,
				user: req.user._id,
				token: req.cookies?.refresh,
			})

			// VERIFY EVERYTHING
			JSON.stringify(decoded.id) === JSON.stringify(decodedRT.id) &&
				JSON.stringify(userDevice.device) === JSON.stringify(userAgent) &&
				next()
		} catch (error) {
			res.status(403)
			throw new Error('Not Authorized.')
		}
	}

	if (!token) {
		res.status(403)
		throw new Error('Not Authorized.')
	}
})

const semiProtected = asyncHandler(async (req, res, next) => {
	let token

	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		try {
			// Get Token from header
			token = req.headers.authorization.split(' ')[1]

			// verify
			// verify
			const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
			const decodedRT = jwt.verify(req.cookies?.refresh, process.env.REFRESH_TOKEN_SECRET)

			// Get User from the Token / User yang login, bukan user yang mau dilihat.
			req.user = await User.findById(decoded.id).select('-password')

			// collect user device from client
			const userAgent = req.headers['user-agent'].toString()

			// find saved user device
			const userDevice = await Device.findOne({
				device: userAgent,
				user: req.user._id,
				token: req.cookies?.refresh,
			})

			// VERIFY EVERYTHING
			JSON.stringify(decoded.id) === JSON.stringify(decodedRT.id) &&
				JSON.stringify(userDevice.device) === JSON.stringify(userAgent) &&
				next()
		} catch (error) {
			next()
		}
	}

	if (!token) {
		next()
	}
})

const protectDev = asyncHandler(async (req, res, next) => {
	const user = req.user

	if (user.role !== 'Admin' || user.role !== 'Dev') {
		res.status(403)
		throw new Error('Forbidden!!!')
	}

	next()
})

const authVerify = async (token, req, next) => {
	// verify
	const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
	const decodedRT = jwt.verify(req.cookies?.refresh, process.env.REFRESH_TOKEN_SECRET)

	// Get User from the Token / User yang login, bukan user yang mau dilihat.
	req.user = await User.findById(decoded.id).select('-password')

	// collect user device from client
	const userAgent = req.headers['user-agent'].toString()

	// find saved user device
	const userDevice = await Device.findOne({
		device: userAgent,
		user: req.user._id,
		token: req.cookies?.refresh,
	})

	// VERIFY EVERYTHING
	JSON.stringify(decoded.id) === JSON.stringify(decodedRT.id) &&
		JSON.stringify(userDevice.device) === JSON.stringify(userAgent) &&
		next()
}

module.exports = { protect, semiProtected, protectDev }
