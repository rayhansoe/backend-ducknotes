const axios = require('axios')

const client_id = process.env.GITHUB_CLIENT_ID
const client_secret = process.env.GITHUB_CLIENT_TOKEN
const server_root_uri = process.env.SERVER_ROOT_URI
const USER_URL = 'https://api.github.com/user'
const TOKEN_URL = 'https://github.com/login/oauth/access_token'
const rootUrl = 'https://github.com/login/oauth/authorize'
const redirectUri = '/api/v1/users/github'

const getGitHubAuthURL = () => {
	return `${rootUrl}?client_id=${client_id}&redirect_uri=${server_root_uri}${redirectUri}?scope=user:email`
}

const getGitHubUser = async (code) => {
	const token = await getAccessToken(code)
	return getUser(token)
}

const getAccessToken = async (code) => {
	const response = await axios.post(
		TOKEN_URL,
		{
			client_id,
			client_secret,
			code,
		},
		{
			headers: { Accept: 'application/json' },
		}
	)

	return response.data.access_token
}

const getUser = async (token) => {
	const response = await axios.get(USER_URL, {
		headers: { Authorization: `Bearer ${token}` },
	})

	return response.data
}

module.exports = {
	getGitHubUser,
	getGitHubAuthURL,
}
