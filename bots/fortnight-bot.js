const Tmetric = require('./helpers/Tmetric')
const Teamup = require('./helpers/Teamup')
const { memberList, nickNames } = require('./helpers/members')
const {
  formattedDate,
  dateInterval,
  filterWorkDays,
} = require('./helpers/date')
const Chat = require('../lib/rocketchat-sdk')

const chat = new Chat({
  url: process.env.ROCKET_CHAT_SERVER_URL,
  token: process.env.ROCKET_CHAT_TOKEN,
  userID: process.env.ROCKET_CHAT_USER_ID,
})

;(async function () {
  const sm = await Teamup.getSMEvent()

  if (formattedDate(sm.endDate) === formattedDate(new Date(Date.now()))) {
    const smStartDate = formattedDate(sm.startDate)
    const smEndDate = formattedDate(sm.endDate)
    const workdays = filterWorkDays(dateInterval(smStartDate, smEndDate))
    await Tmetric.init()
    const users = await Tmetric.getMembers()
    const scrumReports = {}
    const noRecords = {}
    for (const { name, id } of users) {
      let totalHours = 0
      scrumReports[name] = {}
      scrumReports[name].entries = scrumReports[name].entries || []
      try {
        const data = await Tmetric.getTimeEntry(id, smStartDate, smEndDate)
        groupedData = Tmetric.groupTimeEntriesByDay(data)
        for (day of workdays) {
          if (groupedData[day]) {
            let totalTimestamp = 0
            groupedData[day].forEach((t) => {
              if (!t.endTime) {
                t.endTime = new Date()
              }
              totalTimestamp += new Date(t.endTime) - new Date(t.startTime)
            })
            totalHours += totalTimestamp
            const hours = Tmetric.getTimeInHours(totalTimestamp)
            scrumReports[name].entries.push({
              name,
              hours,
              username: memberList[name],
              onLeave: false,
              date: day,
            })
          } else {
            const onLeave = await Teamup.isOnLeave(memberList[name], day)
            scrumReports[name].entries.push({
              name,
              hours: onLeave ? '-' : 0,
              username: memberList[name],
              onLeave,
              date: day,
            })
            if (!onLeave) {
              noRecords[name] = noRecords[name] || {}
              noRecords[name].dates = noRecords[name].dates || []
              noRecords[name].id = id
              noRecords[name].dates.push(day)
            }
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        scrumReports[name].totalHours = Tmetric.getTimeInHours(totalHours)
      }
    }
    const table = generateTable(scrumReports)
    let message = `@all :tmetric: Tmetric data for this Sprint **${formattedDate(
      sm.startDate
    )}** to **${formattedDate(
      sm.endDate
    )}**\n__[maximize chat to see full table]__\n`
    message += '```bash\n' + table + '```\n'
    message += '`-`: on leave\n'
    message += '`0`: no time record\n'
    message += generateMessageForNoRecords(noRecords)
    // Rocketchat message
    await chat.sendChannelMessage('juniors', message, ':police_officer:')
  }
})()

const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function generateTable(data) {
  let table = ' '.repeat(7) + 'W1' + ' '.repeat(32) + ' W2\n' + ' '.repeat(7)
  ;[1, 2].forEach(() => {
    wd.forEach((d) => {
      table += d + ' '.repeat(4)
    })
  })
  table += 'Total'
  table += '\n'
  Object.keys(data).forEach((name) => {
    table += nickNames[name] + ' | '
    data[name].entries.forEach((t) => {
      table += t.hours + ' '.repeat(7 - t.hours.toString().length)
    })
    table += `${data[name].totalHours}\n`
  })
  return table
}

function generateMessageForNoRecords(data) {
  let message = ''
  Object.keys(data).forEach((name) => {
    message += `@${memberList[name]} you have no time records for the following days: `
    const days = []
    data[name].dates.forEach((d) => {
      const link = `https://app.tmetric.com/#/tracker/${Tmetric.getAccountId()}/${
        data[name].id
      }?day=${d.replace(/-/g, '')}`
      days.push(`[${d}](${link})`)
    })
    message += days.join(', ') + '\n'
  })
  message += '**Please, update as sson as possible!**'
  return message
}
