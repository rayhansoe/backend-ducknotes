const mongoose = require('mongoose')
const { Schema, model } = mongoose

const confirmSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Please add a text value'],
		},

		confirmationCode: {
			type: String,
			required: [true, 'Please add a text value'],
		},

		expiredAt: {
			type: Schema.Types.Date,
			required: [true, 'Please add a text value'],
		},
	},

	{
		timestamps: true,
	}
)

module.exports = model('Confirm', confirmSchema)
