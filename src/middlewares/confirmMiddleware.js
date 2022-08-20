const asyncHandler = require('express-async-handler')

const checkIsVerified = asyncHandler(async (req, res, next) => {
	const user = req.user

	if (user.status === 'Active') {
		res.status(200)
		res.json({
			message: 'Your account is already active.',
		})
		return
	}

	next()
})

module.exports = { checkIsVerified }
