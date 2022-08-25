const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const Device = require('../models/deviceModel')

const protectNote = asyncHandler(async (req, res) => {
	const user = req.user
})
