import { ChatBubble } from '../src'
import { Nudge } from '../src/types'
import 'whatwg-fetch' // polyfill for jest

import { VALID_JOIN_PARAMS } from './chat_bubble.test'

describe('ChatBubble nudges', () => {

  // nudges are slow sometimes
  jest.setTimeout(15000)

  it('can receive and engage with nudges', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    await bubble.connect()
    bubble.sendPageView('https://example.com/trigger-nudge', 'My first page')

    const nudge: Nudge = await new Promise<Nudge>(resolve => {
      bubble.onNudge.subscribe(n => resolve(n))
    })

    expect(nudge.message).toMatch(/Hello there from the nudges/)

    await bubble.nudgeShown(nudge)
    await bubble.nudgeEngage(nudge)
    await bubble.nudgeDiscard(nudge)
  })

  it('receives a text nudge', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    await bubble.connect()
    bubble.sendPageView('https://example.com/trigger-text-nudge', 'My text page')

    const nudge: Nudge = await new Promise<Nudge>(resolve => {
      bubble.onNudge.subscribe(n => resolve(n))
    })

    console.log('nudge', nudge)

    expect(nudge.caption).toEqual('My Caption')
    expect(nudge.profile_picture).toEqual('http://')
    expect(nudge.text_input).toEqual({ enabled: true, placeholder: 'Type something' })

    await bubble.nudgeShown(nudge)
    await bubble.nudgeEngage(nudge, { text_input: "Helloooo" })
  })
})
