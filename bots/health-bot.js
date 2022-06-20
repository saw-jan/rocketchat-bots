require('dotenv').config()

const Chat = require('../lib/rocketchat-sdk')

const chat = new Chat({
  url: process.env.ROCKET_CHAT_SERVER_URL,
  token: process.env.ROCKET_CHAT_TOKEN,
  userID: process.env.ROCKET_CHAT_USER_ID,
})

const channel = 'juniors'
const messages = [
  ':exclamation:**Health Alert**:exclamation:\n@all Are you sitting with a **CORRECT POSTURE** :man_technologist::woman_technologist:',
  ':exclamation:**Health Alert**:exclamation:\n@all Take a short break and **STRETCH YOURSELF** :man_running::man_lifting_weights:',
]

const random = Math.floor(Math.random() * 2)

chat
  .sendChannelMessage(channel, messages[random], ':helmet_with_cross:')
  .then((res) => console.log(res))
  .catch((e) => console.log(e))
