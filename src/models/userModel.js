const mongoose = require('mongoose')
const { Schema, model } = mongoose

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Please add a name'],
		},

		email: {
			type: String || null,
			unique: true,
		},

		password: {
			type: String || null,
		},

		username: {
			type: String,
			unique: true,
		},

		gitHubUserId: {
			type: Number || null,
			unique: true,
		},

		status: {
			type: String,
			enum: ['Pending', 'Active'],
			default: 'Pending',
		},

		role: {
			type: String,
			enum: ['User', 'Admin'],
			default: 'User',
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
