const axios = require('axios')

module.exports = class Tmetric {
  #req

  constructor({ url, token }) {
    this.#req = axios.create({
      baseURL: url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  myDetails() {
    return this.#req.get('/user')
  }

  getTimeEntries(accountId, userId, startDate, endDate) {
    if (!accountId) {
      throw new Error(`Invalid accountId: ${accountId}`)
    }
    let today = new Date()
    today = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

    let endpoint = `/accounts/${accountId}/timeentries`
    let params = []
    if (userId) {
      params.push(`userId=${userId}`)
    }
    if (startDate) {
      params.push(`startDate=${startDate}`)
    } else {
      params.push(`startDate=${today}`)
    }
    if (endDate) {
      params.push(`endDate=${endDate}`)
    } else {
      params.push(`endDate=${today}`)
    }

    if (params.length) {
      params = params.join('&')
      endpoint += `?${params}`
    }

    return this.#req.get(endpoint)
  }

  getReports(accountId) {
    return this.#req.get(`/accounts/${accountId}/reports/projects`)
  }

  listMembers(accountId) {
    return this.#req.get(`/accounts/${accountId}/reports/projects/filter`)
  }
}
