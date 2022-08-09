const whitelist = [
	'http://localhost:3000',
	'http://localhost:3500',
	'http://127.0.0.1:5500',
	'http://127.0.0.1:3000',
	'http://localhost:5000',
	'https://www.google.com/',
]
const corsOption = {
	origin: (origin, callback) => {
		if (whitelist.indexOf(origin) !== -1 || whitelist.indexOf(origin) === -1 || !origin) {
			return callback(null, true)
		} else {
			callback(new Error('Not allowed by CORS'))
		}
	},
	optionsSuccessStatus: 200,
}

module.exports = corsOption
