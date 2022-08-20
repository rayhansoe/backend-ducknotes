const moment = require('moment')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

const userEmail = process.env.GMAIL
const userPassword = process.env.PASSWORD
const clientId = process.env.GOOGLE_OAUTH_CLIENTID
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN
const confirmationSecret = process.env.CONFIRMATION_CODE_SECRET

const ConfirmationCode = 5 * 60

const signConfirmationCode = (id) =>
	jwt.sign(id, confirmationSecret, { expiresIn: ConfirmationCode })

const buildCode = (id) => {
	const confirmationCode = signConfirmationCode({ id })
	const expiredAt = moment(new Date()).add(5, 'm').toDate()
	return { confirmationCode, expiredAt }
}

const transport = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		type: 'OAuth2',
		user: userEmail,
		pass: userPassword,
		clientId,
		clientSecret,
		refreshToken,
	},
})

const sendConfirmationEmail = (id, name, email, confirmationCode) => {
	transport
		.sendMail({
			from: userEmail,
			to: email,
			subject: 'Please confirm your account',
			html: `<h1>Email Confirmation</h1>
    <h2>Hello ${name}</h2>
    <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
    <a href=http://localhost:5000/api/v1/users/verify/${id}/${confirmationCode}> Click here</a>
    </div>`,
		})
		.catch((err) => console.log(err))
}

const sendLoginAccoutInfo = (name, email) => {
	transport
		.sendMail({
			from: userEmail,
			to: email,
			subject: 'Your Ducknotes account was used to sign in.',
			html: `<h1>Email Confirmation</h1>
    <h2>Hello ${name}</h2>
    <p>Your Ducknotes account was used to sign in. Please confirm your email by clicking on the following link</p>
    </div>`,
		})
		.catch((err) => console.log(err))
}

const sendOverrideAccoutInfo = (name, email, provider) => {
	transport
		.sendMail({
			from: userEmail,
			to: email,
			subject: `Your Ducknotes account was used to override with your ${provider} account.`,
			html: `<h1>Email Confirmation</h1>
    <h2>Hello ${name}</h2>
    <p>Your Ducknotes account was used to override with your ${provider} account. Please confirm your email by clicking on the following link</p>
    </div>`,
		})
		.catch((err) => console.log(err))
}

const sendCreateAccoutInfo = (name, email) => {
	transport
		.sendMail({
			from: userEmail,
			to: email,
			subject: 'Thank you for creating Ducknotes account.',
			html: `<h1>Email Confirmation</h1>
    <h2>Hello ${name}</h2>
    <p>Thank you for creating Ducknotes account. Please confirm your email by clicking on the following link</p>
    </div>`,
		})
		.catch((err) => console.log(err))
}

module.exports = {
	buildCode,
	sendConfirmationEmail,
	sendCreateAccoutInfo,
	sendLoginAccoutInfo,
	sendOverrideAccoutInfo,
}
