const _ = require('lodash')
const { faker } = require('@faker-js/faker')

const User = require('../models/userModel')
const Device = require('../models/deviceModel')
const {
	sendCreateAccoutInfo,
	sendLoginAccoutInfo,
	sendOverrideAccoutInfo,
} = require('./email-utils')

const createUser = async (userDocument) => {
	const savedUserByUsername = await User.findOne({ username: userDocument.username })
	const savedUserByEmail = await User.findOne({ email: userDocument.email })

	if (savedUserByEmail) {
		throw new Error('Failed to load this data.')
	}

	if (savedUserByUsername) {
		userDocument.username = _.random(1000, 9999)
	}

	if (userDocument.email) {
		userDocument.status = 'Active'
	}

	const user = await User.create({
		...userDocument,
	})

	if (user.email) {
		sendCreateAccoutInfo(user.name, user.email)
	}

	return user
}

const getUserByGoogleId = async (googleUserId) => {
	const user = await User.findOne({ googleUserId })

	if (user) sendLoginAccoutInfo(user.name, user.email)

	return user
}

const getUserByGoogleEmail = async (googleUser) => {
	const user = await User.findOne({ email: googleUser.email })

	if (user) {
		user.googleUserId = googleUser.id
		user.avatar = user.avatar ? user.avatar : googleUser.picture
		user.isVerified = true
		await user.save()

		sendOverrideAccoutInfo(user.name, user.email, 'Google')
	}

	return user
}

const getUserByGitHubId = async (gitHubUserId) => {
	const user = await User.findOne({ gitHubUserId })

	if (user) sendLoginAccoutInfo(user.name, user.email)

	return user
}

const getUserByGitHubEmail = async (gitHubUser) => {
	const user = await User.findOne({ email: gitHubUser.email })

	if (user) {
		user.overwrite({
			...user,
			gitHubUserId: gitHubUser.id,
			avatar: gitHubUser.avatar_url,
			status: 'Active',
		})
		await user.save()

		sendOverrideAccoutInfo(user.name, user.email, 'GitHub')
	}

	return user
}

const checkUserDevices = async (res, userId) => {
	const devices = await Device.find({ user: userId })

	// if user devices limit.
	if (devices && devices.length > 5) {
		res.status(401)
		throw new Error('Your Devices is limit. Logout or tell admin.')
	}
}

const findOrCreateDevice = async (res, userAgent, id, refreshToken) => {
	// create a new one or find saved device
	let device =
		(await Device.findOne({ device: userAgent, user: id })) ||
		(await Device.create({
			device: userAgent,
			user: id,
			token: refreshToken,
		}))

	// check device
	if (!device) {
		res.status(401)
		throw new Error('Unauthorized: Invalid Credentials.')
	}

	return device
}

const createDummy = async () => {
	const firstName = faker.name.firstName()
	const lastName = faker.name.lastName()

	const dummy = await User.create({
		name: faker.name.fullName({ firstName, lastName }),
		email: faker.internet.exampleEmail(firstName, lastName),
		avatar: faker.internet.avatar(),
		username: faker.internet.userName(firstName, lastName),
		isDummy: true,
		isVerified: true,
	})

	return dummy
}

const createDummies = async (total) => {
	if (total) {
		Array(total)
			.fill(0)
			.forEach(async () => {
				await createDummy()
			})
		return
	}
	await createDummy()
}

module.exports = {
	createUser,
	getUserByGoogleId,
	getUserByGoogleEmail,
	getUserByGitHubId,
	getUserByGitHubEmail,
	checkUserDevices,
	findOrCreateDevice,
	createDummies,
}
