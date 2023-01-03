// load envs
require('dotenv').config()

const Tmetric = require('../lib/tmetric-sdk')
const Chat = require('../lib/rocketchat-sdk')
const { memberList } = require('./helpers/members')

const tmetric = new Tmetric({
  url: process.env.TMETRIC_SERVER_URL,
  token: process.env.TMETRIC_TOKEN,
})
const chat = new Chat({
  url: process.env.ROCKET_CHAT_SERVER_URL,
  token: process.env.ROCKET_CHAT_TOKEN,
  userID: process.env.ROCKET_CHAT_USER_ID,
})

function getAccountId() {
  return tmetric
    .myDetails()
    .then((res) => res.data.activeAccountId)
    .catch((e) => console.log(e))
}

;(async function () {
  const accId = await getAccountId()
  const users = await tmetric
    .listMembers(accId)
    .then((res) => {
      return res.data.users
        .map((user) => {
          if (Object.keys(memberList).includes(user.name)) {
            return { name: user.name, id: user.id }
          }
        })
        .filter((user) => user)
    })
    .catch((e) => console.log(e))

  let forgetToStopMessage = ''
  for (const { name, id } of users) {
    const data = await tmetric
      .getTimeEntries(accId, id)
      .then((res) => res.data)
      .catch((e) => {
        throw e
      })

    if (data.length) {
      let entries = 0
      data.forEach((t) => {
        if (!t.endTime) {
          t.endTime = new Date()
        }
        entries += new Date(t.endTime) - new Date(t.startTime)
      })

      // if total hours is greater than 12 hrs a day
      if (entries > 3600 * 12 * 1000) {
        const url = `https://app.tmetric.com/#/tracker/${accId}/${id}`
        forgetToStopMessage += `@${memberList[name]} Did you forget to stop the :tmetric: timer?\nPlease update: ${url}\n`
      }
    }
  }

  // ping if timer is running
  if (forgetToStopMessage) {
    await chat.sendChannelMessage(
      'cohort',
      forgetToStopMessage,
      ':police_officer:'
    )
  }
})()
