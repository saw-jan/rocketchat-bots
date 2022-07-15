const SDK = require('../../lib/tmetric-sdk')
const { memberList } = require('./members')
const { formattedDate } = require('./date')

class Tmetric {
  #tmetric
  #accountId

  constructor() {
    require('dotenv').config()

    this.#tmetric = new SDK({
      url: process.env.TMETRIC_SERVER_URL,
      token: process.env.TMETRIC_TOKEN,
    })
  }

  async init() {
    this.#accountId = await this.#tmetric
      .myDetails()
      .then((res) => res.data.activeAccountId)
      .catch((e) => {
        throw e
      })
  }

  getMembers() {
    return this.#tmetric
      .listMembers(this.#accountId)
      .then((res) => {
        return res.data.users
          .map((user) => {
            if (Object.keys(memberList).includes(user.name)) {
              return { name: user.name, id: user.id }
            }
          })
          .filter((user) => user)
      })
      .catch((e) => {
        throw e
      })
  }

  getTimeEntry(userId, sDate, eDate) {
    return this.#tmetric
      .getTimeEntries(this.#accountId, userId, sDate, eDate)
      .then((res) => res.data)
      .catch((e) => {
        throw e
      })
  }

  getTimeInHours(timestamp) {
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

  groupTimeEntriesByDay(entries) {
    const groupedData = []
    entries.forEach((entry) => {
      const date = formattedDate(entry.startTime)
      groupedData[date] = groupedData[date]
        ? [...groupedData[date], entry]
        : [entry]
    })
    return groupedData
  }
}

module.exports = new Tmetric()
