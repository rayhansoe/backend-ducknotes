const { codeBlock, WebhookClient } = require('discord.js')

const webhookId = process.env.DISCORD_WEBHOOK_CLIENT_ID
const webhookToken = process.env.DISCORD_WEBHOOK_CLIENT_TOKEN

const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken })

const sendLog = (message) => {
	webhookClient.send({
		content: codeBlock(message),
	})
}

const sendCreateLog = (message) => {
	sendLog(codeBlock(message))
}

const sendReadLog = (message) => {
	sendLog(codeBlock(message))
}

module.exports = {
	sendLog,
	sendCreateLog,
}
