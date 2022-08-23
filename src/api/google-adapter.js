const axios = require('axios')
const qs = require('querystring')

const client_id = process.env.GOOGLE_OAUTH_CLIENTID
const client_secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
const server_root_uri = process.env.SERVER_ROOT_URI
const redirectUri = '/api/v1/users/google'
const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'

const getGoogleAuthURL = () => {
	const options = {
		redirect_uri: `${server_root_uri}${redirectUri}`,
		client_id,
		access_type: 'offline',
		response_type: 'code',
		prompt: 'consent',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
		].join(' '),
	}

	return `${rootUrl}?${qs.stringify(options)}`
}

const getGoogleTokens = async (code) => {
	const url = 'https://oauth2.googleapis.com/token'
	const values = {
		code,
		client_id,
		client_secret,
		redirect_uri: `${server_root_uri}${redirectUri}`,
		grant_type: 'authorization_code',
	}

	const response = await axios.post(url, qs.stringify(values), {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	})

	return response.data
}

const getGoogleUser = async (code) => {
	const { id_token, access_token } = await getGoogleTokens(code)
	return getUser(id_token, access_token)
}

const getUser = async (id_token, access_token) => {
	const url = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`
	const response = await axios.get(url, {
		headers: {
			Authorization: `Bearer ${id_token}`,
		},
	})

	return response.data
}

module.exports = {
	getGoogleAuthURL,
	getGoogleTokens,
	getGoogleUser,
}
