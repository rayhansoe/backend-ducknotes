const mongoose = require('mongoose')
const { Schema, model } = mongoose

const note = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},

		title: {
			type: String,
			required: [true, 'Please add a text value'],
		},

		note: Schema.Types.Mixed,
	},

	{
		timestamps: true,
	}
)

// const note = new Schema(
// 	{
// 		user: {
// 			type: Schema.Types.ObjectId,
// 			ref: 'User',
// 		},

// 		title: {
// 			type: String,
// 			required: [true, 'Please add a text value'],
// 		},

// 		note: [
// 			{
// 				type: {
// 					type: String,
// 					required: true,
// 				},

// 				children: [
// 					{
// 						text: {
// 							type: String,
// 							text: true,
// 							required: [true, 'Please add a text value'],
// 						},

// 						bold: Boolean,

// 						italic: Boolean,

// 						code: Boolean,

// 						underline: Boolean,

// 						_id: false,
// 					},
// 				],

// 				align: String,
// 				_id: false,
// 			},
// 		],
// 	},

// 	{
// 		timestamps: true,
// 	}
// )

// note.index({ 'note.children': 'text' })
// note.index({ note: 'text' })

const noteSchema = model('Note', note)

module.exports = noteSchema
