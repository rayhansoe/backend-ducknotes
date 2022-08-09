const mongoose = require('mongoose')
const { Schema, model } = mongoose

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Please add a name'],
		},

		email: {
			type: String,
			required: [true, 'Please add an email.'],
			unique: true,
		},

		password: {
			type: String,
			required: [true, 'Please add an password.'],
		},

		username: {
			type: String,
			required: [true, 'Please add an username.'],
			unique: true,
		},

		devices: {
			type: [Schema.Types.ObjectId],
			ref: 'Device',
			unique: true,
		},
	},

	{
		timestamps: true,
	}
)

module.exports = model('User', userSchema)
