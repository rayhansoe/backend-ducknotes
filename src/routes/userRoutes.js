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
} = require('../controllers/userControllers')
const { getGoogleAuthURL } = require('../api/google-adapter')

// middlewares
const { protect, semiProtected, protectDev } = require('../middlewares/authMiddleware')
const { checkIsVerified } = require('../middlewares/confirmMiddleware')
const { getGitHubAuthURL } = require('../api/github-adapter')

// routes
// router.route('/:username').get()
router.get('/google/url', (req, res) => {
	res.send(getGoogleAuthURL())
})
router.route('/google/').get(googleHandler)
router.get('/github/url', (req, res) => {
	res.send(getGitHubAuthURL())
})
router.route('/github').get(OAuthGitHub)
router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/resend').get(protect, checkIsVerified, resendEmailVerification)
router.route('/refresh').get(handleRefreshToken)
router.route('/verify/:id/:confirmationCode').get(verifyAccount)
router.route('/logout').delete(protect, logout)
router.route('/logout-all').delete(protect, protectDev, logoutAll)

module.exports = router
