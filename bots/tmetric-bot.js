// load envs
require('dotenv').config()

const Teamup = require('@sawjan/teamup-client')
const Tmetric = require('../lib/tmetric-sdk')
const Chat = require('../lib/rocketchat-sdk')
const { memberList } = require('./helpers/members')

const tmetric = new Tmetric({
  url: process.env.TMETRIC_SERVER_URL,
  token: process.env.TMETRIC_TOKEN,
})
const { Events, SubCalendar } = new Teamup({
  url: process.env.TEAMUP_SERVER_URL,
  calToken: process.env.TEAMUP_CALENDAR_TOKEN,
  apiKey: process.env.TEAMUP_API_KEY,
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

const dups = {}

;(async function () {
  const timeEntries = []

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

  for (const { name, id } of users) {
    const data = await tmetric
      .getTimeEntries(accId, id)
      .then((res) => res.data)
      .catch((e) => {
        throw e
      })

    if (!data.length) {
      const onLeave = await isOnLeave(memberList[name])
      timeEntries.push({
        name,
        time: 0,
        username: memberList[name],
        onLeave,
      })
    } else {
      let entries = 0
      data.forEach((t) => {
        if (!t.endTime) {
          t.endTime = new Date()
        }
        entries += new Date(t.endTime) - new Date(t.startTime)
      })

      entries = getTime(entries)

      timeEntries.push({
        name,
        time: entries,
        username: memberList[name],
        onLeave: false,
      })
    }
  }

  let message = generateTmetricTable(timeEntries)
  message += `\nTmetric: https://app.tmetric.com/#/tracker/${accId}`
  // Rocketchat message
  await chat.sendChannelMessage('cohort', message, ':police_officer:')
})()

function getTime(timestamp) {
  const seconds = timestamp / 1000
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes}M`
  } else {
    const hours = (minutes / 60).toString().split('.')[0]
    let remMins = minutes - hours * 60
    remMins = remMins < 10 ? `0${remMins}` : remMins
    return `${hours}.${remMins}H`
  }
}

function generateTmetricTable(timeEntries) {
  let message = '@all Update your :tmetric: for today!\n\n```\n'
  let warnLine = ''
  const maxLimit = getLongestNameLen(timeEntries.map((entry) => entry.name))

  timeEntries.forEach((entry) => {
    message += `${entry.name}${' '.repeat(maxLimit - entry.name.length)}\t${
      entry.time
    }${entry.onLeave ? ' [On Leave]' : ''}\n`
    if (!entry.time && !entry.onLeave) {
      warnLine += `@${entry.username} `
    }
  })
  message += '```'
  if (warnLine !== '') {
    warnLine += '\n**Please update as soon as possible!**'
    message += '\n' + warnLine
  }
  return message
}

function getLongestNameLen(names) {
  let len = 0
  names.forEach((name) => {
    if (name.length > len) len = name.length
  })
  return len
}

async function isOnLeave(username) {
  const leaves = await getOnLeaveList()
  for (const leave of leaves) {
    if (leave.allDay) {
      if (
        Object.values(dups).includes(
          leave.title.trim().replace(' ', '.').toLowerCase()
        )
      ) {
        if (
          username === leave.title.trim().replace(' ', '.').toLowerCase() ||
          username === leave.who.trim().replace('@', '')
        ) {
          return true
        }
      } else {
        if (
          username === leave.title.trim().split(' ')[0].toLowerCase() ||
          username === leave.who.trim().replace('@', '')
        ) {
          return true
        }
      }
    }
  }
  return false
}

async function getOnLeaveList() {
  let leaveCalId
  await SubCalendar.listSubCalendars()
    .then(({ data: { subcalendars } }) => {
      for (const subCal of subcalendars) {
        if (subCal.name === 'leave') {
          leaveCalId = subCal.id
          break
        }
      }
    })
    .catch((err) => console.log(err.response.data))

  let leaves = []
  if (leaveCalId) {
    const date = new Date()
    const today = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`

    await Events.listEvents({
      startDate: today,
      endDate: today,
      subcalendarId: [leaveCalId],
    })
      .then(({ data: { events } }) => {
        leaves = events.map((event) => ({
          title: event.title,
          who: event.who,
          allDay: event.all_day,
        }))
      })
      .catch((err) => console.log(err.response.data))
  }
  return leaves
}
