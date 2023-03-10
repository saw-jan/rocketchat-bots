// load envs
require('dotenv').config()

const Teamup = require('@sawjan/teamup-client')
const Chat = require('../lib/rocketchat-sdk')
const { memberList } = require('./helpers/members')

const members = Object.values(memberList)

const chat = new Chat({
  url: process.env.ROCKET_CHAT_SERVER_URL,
  token: process.env.ROCKET_CHAT_TOKEN,
  userID: process.env.ROCKET_CHAT_USER_ID,
})
const { Events, SubCalendar } = new Teamup({
  url: process.env.TEAMUP_SERVER_URL,
  calToken: process.env.TEAMUP_CALENDAR_TOKEN,
  apiKey: process.env.TEAMUP_API_KEY,
})

async function getWFHUsers(calName) {
  let wfhCalId
  await SubCalendar.listSubCalendars()
    .then(({ data: { subcalendars } }) => {
      for (const subCal of subcalendars) {
        if (subCal.name === calName) {
          wfhCalId = subCal.id
          break
        }
      }
    })
    .catch((err) => console.log(err.response.data))

  wfhUsers = []
  if (wfhCalId) {
    // get all events identified by wfhCalId
    const date = new Date()
    const today = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`

    await Events.listEvents({
      startDate: today,
      endDate: today,
      subcalendarId: [wfhCalId],
    })
      .then(({ data: { events } }) => (wfhUsers = events))
      .catch((err) => console.log(err.response.data))
  }
  return wfhUsers
}

function sendMessage(username, message) {
  return chat.sendDirectMessage(username, message).catch((e) => console.log(e))
}

;(async function () {
  const users = await getWFHUsers('work-from-home')

  users.forEach((user) => {
    let username = user.title.toLowerCase().trim()
    if (username === 'kiran adhikari') {
      username = username.replace(/\s/g, '.')
    }
    if (members.includes(username)) {
      // send message
      const date = new Date(user.start_dt.replace(/T.*/, ''))
        .toUTCString()
        .replace(/ [0-9]{2}:.*/, '')
      let message = `Ahh! you have **WORK FROM HOME** today\n PLEASE COME BACK :frowning2:`
      sendMessage(username, message)
    }
  })
})()
