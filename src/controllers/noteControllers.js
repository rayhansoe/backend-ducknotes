const asyncHandler = require('express-async-handler')
const Note = require('../models/NoteModel')

// @desc Set Note || Create Note
// @route POST /api/v1/notes
// @access PRIVATE
const createNote = asyncHandler(async (req, res) => {
	const { title, note } = req.body
	const user = req.user
	const newNote = await Note.create({
		user: user._id,
		title: title,
		note: note,
	})

	res.status(201).json({ newNote, message: 'New Note Created!' })
})

// @desc Get Notes
// @route GET /api/v1/notes
// @access PRIVATE
const getNotes = asyncHandler(async (req, res) => {
	let notes
	let limit = 15
	const user = req.user
	const lastNote = req.query._lastNote

	if (req?.query?._limit) {
		limit = parseInt(req?.query?._limit)
	}

	notes = await Note.find({
		user: user._id,
	})
		.sort({ updatedAt: 'desc' })
		.limit(limit)
		.select({ note: 1, _id: 1, updatedAt: 1 })
		.lean()

	if (lastNote) {
		notes = await Note.find({ user: user._id, updatedAt: { $lt: lastNote } })
			.sort({ updatedAt: 'desc' })
			.limit(limit)
			.select({ note: 1, _id: 1, updatedAt: 1 })
			.lean()
	}

	res.status(200).json(notes)
})

// @desc Get Note by ID
// @route GET /api/v1/notes/:id
// @access PRIVATE
const getNoteById = asyncHandler(async (req, res) => {
	const user = req.user
	const note = await Note.findOne({ id: req.params.id, user: user._id })
		.select({ note: 1, _id: 1, updatedAt: 1 })
		.lean()

	res.status(200).json(note)
})

// @desc Get Notes by Query
// @route Get /api/v1/notes/search
// @access PRIVATE
const getNotesByQuery = asyncHandler(async (req, res) => {
	let notes
	let limit = 5
	const user = req.user
	const lastNote = req?.query?.lastNote
	const word = req?.body?.query

	if (req?.query?.limit) {
		limit = parseInt(req?.query?.limit)
	}

	try {
		notes = await Note.find({
			user: user._id,
			'note.children': { $elemMatch: { text: { $regex: word, $options: 'i' } } },
		})
			.sort({ updatedAt: 'desc' })
			.limit(limit)
			// .select({ note: 1, _id: 1, updatedAt: 1 })
			.lean()

		if (lastNote) {
			// notes = await Note.find( { note: [{ children: [{ text: { $regex: word, $options: "i"} }] }], updatedAt: { $lt: lastNote }  })
			notes = await Note.find({
				user: user._id,
				'note.children': { $elemMatch: { text: { $regex: word, $options: 'i' } } },
				updatedAt: { $lt: lastNote },
			})
				.sort({ updatedAt: 'desc' })
				.limit(limit)
				// .select({  note: 1, _id: 1, updatedAt: 1 })
				.lean()
		}

		res.status(200).json(notes)
	} catch (error) {
		res.status(401)
		console.log(error)
		throw new Error(error)
	}
})

// @desc Update Note by ID
// @route PUT /api/v1/notes/:id
// @access PRIVATE
const updateNote = asyncHandler(async (req, res) => {
	const user = req.user
	const note = await Note.findOne({ user: user._id, id: req.params.id })

	if (!note) {
		res.status(400)

		throw new Error('Note Not Found!')
	}

	if (!req.body) {
		res.status(400)

		throw new Error('Note Not Found!')
	}

	if (!req.body?.note) {
		res.status(400)

		throw new Error('Missing something!')
	}

	try {
		const updatedNoteFromClient = req.body?.note

		const updatedNote = await Note.findOneAndUpdate(
			{ user: user._id, id: req.params.id },
			{ note: updatedNoteFromClient },
			{
				new: true,
			}
		)
			.select({ note: 1, _id: 1, updatedAt: 1 })
			.lean()

		res.status(200).json({
			updatedNote,
			message: 'The Note is Updated',
		})
	} catch (error) {
		res.status(401)
		throw new Error(error)
	}
})

// *
// **
// ****
// export all functions
module.exports = {
	createNote,
	getNotes,
	getNoteById,
	updateNote,
	getNotesByQuery,
}
