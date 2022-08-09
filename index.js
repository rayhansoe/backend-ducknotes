const cors = require('cors')
const colors = require('colors')
const helmet = require('helmet')
const express = require('express')
const dotenv = require('dotenv').config()
const compression = require('compression')
const cookieParser = require('cookie-parser')

const connectDB = require('./src/configs/db')
const corsOption = require('./src/configs/corsOption')
const credentials = require('./src/middlewares/credentials')
const { errorHandler } = require('./src/middlewares/errorHandler')

// port
const port = process.env.PORT || 5000

connectDB()

const app = express()

app.use(helmet())

app.use(compression())

app.use(credentials)

app.use(cors(corsOption))

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// cookie middleware
app.use(cookieParser())

// Routes
app.use('/api/v1/users', require('./src/routes/userRoutes'))
// app.use('/api/v1/notes', require('./src/routes/'))

// check
if (process.env.NODE_ENV === 'production') {
	app.get('/', (req, res) => res.redirect(301, 'https://baru-duck.vercel.app/notes'))
} else {
	app.get('/', (req, res) => res.send('Please set to production'))
}

// error handler middleware
app.use(errorHandler)

app.listen(port, () => console.log(`Server started on port ${port}`))
