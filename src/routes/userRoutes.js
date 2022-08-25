const express = require('express')
const router = express.Router()

// functions
const {
	registerUser,
	OAuthGitHub,
	loginUser,
	verifyAccount,
	resendEmailVerification,
	handleRefreshToken,
	logout,
	logoutAll,
	googleHandler,
	createUserDummies,
	useDummy,
} = require('../controllers/userControllers')
const { getGoogleAuthURL } = require('../api/google-adapter')

// middlewares
const { protect, semiProtected, protectDev } = require('../middlewares/authMiddleware')
const { checkIsVerified } = require('../middlewares/confirmMiddleware')
const { getGitHubAuthURL } = require('../api/github-adapter')

// routes
// router.route('/:username').get()

// get Google OAuth URL
router.get('/google/url', (req, res) => {
	res.send(getGoogleAuthURL())
})

// Google OAuth || need to change to POST METHOD
router.route('/google/').get(googleHandler)

// get GitHub OAuth URL
router.get('/github/url', (req, res) => {
	res.send(getGitHubAuthURL())
})

// GitHub OAuth
router.route('/github').get(OAuthGitHub)

// User Register
router.route('/register').post(registerUser)

// User Login
router.route('/login').post(loginUser)

// Send Email Verification
router.route('/resend').get(protect, checkIsVerified, resendEmailVerification)

// Refresh Access Token
router.route('/refresh').get(handleRefreshToken)

// Verif Email
router.route('/verify/:id/:confirmationCode').get(verifyAccount)

// User Logout
router.route('/logout').delete(protect, logout)

// Users Logoout || Logout All
router.route('/logout-all').delete(protect, protectDev, logoutAll)

// User Dummy || Use Dummy Account
router.route('/use-dummy').post(useDummy)

// Create Dummies Account by DEV
router.route('/create-dummies').post(protect, protectDev, createUserDummies)

module.exports = router
