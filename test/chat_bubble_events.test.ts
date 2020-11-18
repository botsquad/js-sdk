import { ChatBubble } from '../src'
import { Socket } from 'phoenix'
import 'whatwg-fetch' // polyfill for jest

import { VALID_JOIN_PARAMS } from './chat_bubble.test'

describe('ChatBubble events', () => {
  it('can receive events that are sent in the bot chat', async done => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    const info = await bubble.connect()

    const socket: Socket = (bubble as any).socket
    const topic = `bot:${VALID_JOIN_PARAMS.botId}~event-test`

    const channel = socket.channel(topic, { delegate_token: info.userToken })
    channel.join().receive('ok', () => {
      bubble.onEvent.subscribe(e => {
        expect(e.name).toEqual('event_test')
        expect(e.payload).toEqual({ foo: '123', bar: [1, 2, 3] })

        done()
      })
    })
  })
})
