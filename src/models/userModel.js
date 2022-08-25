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
			unique: true,
			sparse: true,
		},

		password: {
			type: String,
		},

		username: {
			type: String,
			unique: true,
		},

		gitHubUserId: {
			type: Number,
			unique: true,
			sparse: true,
		},

		googleUserId: {
			type: Number,
			unique: true,
			sparse: true,
		},

		notes: {
			type: [Schema.Types.ObjectId],
			ref: 'Note',
		},

		avatar: {
			type: String,
		},

		isDummy: {
			type: Boolean,
		},

		isVerified: {
			type: Boolean,
			enum: [false, true],
			default: false,
		},

		// untuk status online or offline user
		// status: {
		// 	type: String,
		// 	enum: ['Pending', 'Active'],
		// 	default: 'Pending',
		// },

		role: {
			type: String,
			enum: ['User', 'Admin'],
			default: 'User',
		},
	},

	{
		timestamps: true,
	}
)

module.exports = model('User', userSchema)
