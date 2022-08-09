const jwt = require('jsonwebtoken')

const accessSecret = process.env.ACCESS_TOKEN_SECRET
const refreshSecret = process.env.REFRESH_TOKEN_SECRET

// const AccessExpiration = 5 * 60
const TokenExpiration = {
	Access: 5 * 60,
	Refresh: 7 * 24 * 60 * 60,
}

const signAccessToken = (id) => jwt.sign(id, accessSecret, { expiresIn: TokenExpiration.Access })
const signRefreshToken = (id) => jwt.sign(id, refreshSecret)

export const buildTokens = (id) => {
	const accessToken = signAccessToken(id)
	const refreshToken = signRefreshToken(id)

	return { accessToken, refreshToken }
}

const isProduction = process.env.NODE_ENV === 'production'

const defaultCookieOptions = {
	httpOnly: true,
	secure: isProduction,
	sameSite: isProduction ? 'None' : 'lax',
}

const accessTokenCookieOptions = {
	...defaultCookieOptions,
	maxAge: TokenExpiration.Access * 1000,
}

const refreshTokenCookieOptions = {
	...defaultCookieOptions,
	maxAge: TokenExpiration.Refresh * 1000,
}

export const setTokens = (res, access, refresh) => {
	res.cookie('access', access, accessTokenCookieOptions)
	if (refresh) res.cookie('refresh', refresh, refreshTokenCookieOptions)
}
