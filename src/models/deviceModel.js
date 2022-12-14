const mongoose = require('mongoose')
const { Schema, model } = mongoose

const deviceSchema = mongoose.Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Please add a text value'],
		},

		device: {
			type: String,
			required: [true, 'Please add a text value'],
		},

		token: {
			type: String,
			required: [true, 'Please add a text value'],
		},
	},

	{
		timestamps: true,
	}
)

module.exports = model('Device', deviceSchema)
