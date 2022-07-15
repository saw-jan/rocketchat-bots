const axios = require('axios')

module.exports = class Chat {
  #req

  constructor({ url, token, userID }) {
    this.#req = axios.create({
      baseURL: url,
      headers: {
        'X-Auth-Token': token,
        'X-User-Id': userID,
      },
    })
  }

  listChannelMembers(channel, limit = 100) {
    return this.#req
      .get(`/channels.members?roomName=${channel}&count=${limit}`)
      .then((res) => res.data)
      .catch((err) => err.response.data)
  }

  listChannels() {
    return this.#req
      .get('/channels.list')
      .then((res) => res.data)
      .catch((err) => err.response.data)
  }

  listPrivateChannels() {
    return this.#req
      .get('/groups.list')
      .then((res) => res.data)
      .catch((err) => err.response.data)
  }

  sendDirectMessage(username, message) {
    return this.#req
      .post('/chat.postMessage', {
        channel: `@${username}`,
        text: message,
        emoji: ':robot:',
      })
      .then((res) => res.data)
      .catch((err) => err.response.data)
  }

  sendChannelMessage(channel, message, avatar = ':ghost:') {
    return this.#req
      .post('/chat.postMessage', {
        channel: `#${channel}`,
        text: message,
        emoji: avatar,
      })
      .then((res) => res.data)
      .catch((err) => err.response.data)
  }

  sendChannelMessage2(channel, message, avatar = ':ghost:') {
    return this.#req
      .post('/chat.postMessage', {
        channel: `#${channel}`,
        text: message,
        emoji: avatar,
        alias: 'Bot',
      })
      .then((res) => res.data)
      .catch((err) => err.response.data)
  }
}
