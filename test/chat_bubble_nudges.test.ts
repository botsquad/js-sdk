import { ChatBubble } from '../src'
import { Nudge } from '../src/types'
import 'whatwg-fetch' // polyfill for jest

import { VALID_JOIN_PARAMS } from './chat_bubble.test'

describe('ChatBubble nudges', () => {
  it('can receive and engage with nudges', async () => {

    // nudges are slow sometimes
    jest.setTimeout(15000)

    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    await bubble.connect()
    bubble.sendPageView('https://example.com/trigger-nudge', 'My first page')

    const nudge: Nudge = await new Promise<Nudge>(resolve => {
      bubble.onNudge.subscribe(n => resolve(n))
    })

    expect(nudge.message).toMatch(/Hello there from the nudges/)

    await bubble.nudgeEngage(nudge)
    await bubble.nudgeDiscard(nudge)
  })
})
