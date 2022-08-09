const express = require('express')
const router = express.Router()

// functions
const {
	loginUser,
	registerUser,
	checkUser,
	// getUsers,
	// getUserProfile,
	logout,
	handleRefreshToken,
} = require('../controllers/userControllers')

// middlewares
const { protect, semiProtected } = require('../middlewares/authMiddleware')

// routes
// router.route('/github').post() // later
// router.route('/google').post() // later
// router.route('/:username').get()
router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/check').get(protect, checkUser)
router.route('/refresh').get(handleRefreshToken)
router.route('/logout').delete(protect, logout)

module.exports = router
