const mongoose = require('mongoose')

const deviceSchema = mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Device', deviceSchema)
