const express = require('express')
const router = express.Router()

const { protect } = require('../middlewares/authMiddleware')
const {
	createNote,
	getNotes,
	getNoteById,
	updateNote,
	getNotesByQuery,
} = require('../controllers/noteControllers')

router.route('/').get(protect, getNotes).post(protect, createNote)

router.route('/search').get(protect, getNotesByQuery)

router.route('/:id').get(protect, getNoteById).put(protect, updateNote)

module.exports = router
