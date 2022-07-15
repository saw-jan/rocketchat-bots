module.exports = {
  today: () => {
    const date = new Date()
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  },

  formattedDate: (dateSrting) => {
    const date = new Date(dateSrting)
    let month = date.getMonth() + 1
    let day = date.getDate()
    if (month < 10) {
      month = `0${month}`
    }
    if (day < 10) {
      day = `0${day}`
    }
    return `${date.getFullYear()}-${month}-${day}`
  },

  getHours: (timestamp) => {
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
  },

  dateInterval: (startDate, endDate) => {
    const dates = []
    const firstDate = new Date(startDate)
    dates.push(module.exports.formattedDate(firstDate))
    const lastDate = new Date(endDate)
    let nextDate = new Date(
      new Date(startDate).setDate(firstDate.getDate() + 1)
    )

    count = 1
    while (nextDate.getTime() <= lastDate.getTime()) {
      dates.push(module.exports.formattedDate(nextDate))

      count++
      nextDate = new Date(
        new Date(startDate).setDate(firstDate.getDate() + count)
      )
    }

    return dates
  },

  filterWorkDays(dates) {
    // 0 = Sunday, 6 = Saturday
    return dates.filter((date) => ![0, 6].includes(new Date(date).getDay()))
  },
}
