const SDK = require('@sawjan/teamup-client')
// const axios = require('axios')
const { today, getHours, formattedDate } = require('./date')
const { dups } = require('./members')

class Teamup {
  #teamup
  #fetch
  #calSM = 'scrum-masters'
  #calLeave = 'leave'

  constructor() {
    require('dotenv').config()

    this.#teamup = new SDK({
      url: process.env.TEAMUP_SERVER_URL,
      calToken: process.env.TEAMUP_CALENDAR_TOKEN,
      apiKey: process.env.TEAMUP_API_KEY,
    })

    // this.#fetch = axios.create({
    //   baseURL: `${process.env.TEAMUP_SERVER_URL}/${process.env.TEAMUP_CALENDAR_TOKEN}`,
    //   headers: {
    //     'Teamup-Token': process.env.TEAMUP_API_KEY,
    //   },
    // })
  }

  async getCalendarId(calendarName) {
    let calendarId
    await this.#teamup.SubCalendar.listSubCalendars()
      .then(({ data: { subcalendars } }) => {
        for (const subCal of subcalendars) {
          if (subCal.name === calendarName) {
            calendarId = subCal.id
            break
          }
        }
      })
      .catch((err) => {
        throw err.response.data
      })

    return calendarId
  }

  /**
   *
   * @param {number|Array} calendarIds
   *
   * @returns {Promise<Array>}
   */
  async getEventsByCalendars(calendarIds, startDate, endDate) {
    let calEvents = []
    await this.#teamup.Events.listEvents({
      startDate: startDate ? startDate : today(),
      endDate: endDate ? endDate : today(),
      subcalendarId: calendarIds instanceof Array ? calendarIds : [calendarIds],
    })
      .then(({ data: { events } }) => {
        calEvents = events.map((event) => ({
          id: event.id,
          title: event.title,
          who: event.who,
          allDay: event.all_day,
          startDate: event.start_dt,
          endDate: event.end_dt,
        }))
      })
      .catch((err) => {
        throw err.response.data
      })

    return calEvents
  }

  async getSMEvent() {
    const calendarId = await this.getCalendarId(this.#calSM)
    const events = await this.getEventsByCalendars(calendarId)
    return events[0]
  }

  async isOnLeave(username, date) {
    const calendarId = await this.getCalendarId(this.#calLeave)
    const leaves = await this.getEventsByCalendars(calendarId, date, date)

    const userLeaves = this.filterUserLeaves(leaves, username)
    let addedHours = 0
    for (const leave of userLeaves) {
      if (leave.allDay) {
        return true
      } else {
        addedHours += new Date(leave.endDate) - new Date(leave.startDate)
        if (userLeaves.length - 1 === userLeaves.indexOf(leave)) {
          // 28800000 = 8 hrs
          if (addedHours >= 28800000) {
            return true
          }
        }
      }
    }
    return false
  }

  filterUserLeaves(leaves, username) {
    return leaves.filter((leave) => {
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
      return false
    })
  }

  getLeaveHours(startDate, endDate) {
    const ts = new Date(endDate) - new Date(startDate)
    console.log(getHours(ts))
  }
}

module.exports = new Teamup()
