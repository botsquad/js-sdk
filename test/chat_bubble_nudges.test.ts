import { ChatBubble } from '../src'
import { Nudge } from '../src/types'
import 'whatwg-fetch' // polyfill for jest

import { VALID_JOIN_PARAMS } from './chat_bubble.test'

describe('ChatBubble nudges', () => {
  // nudges are slow sometimes

  it('can receive and engage with nudges', async () => {
    jest.setTimeout(15000)

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
    jest.setTimeout(15000)

    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    await bubble.connect()
    bubble.sendPageView('https://example.com/trigger-text-nudge', 'My text page')

    const nudge: Nudge = await new Promise<Nudge>(resolve => {
      bubble.onNudge.subscribe(n => resolve(n))
    })

    expect(nudge.caption).toEqual('My Caption')
    expect(nudge.profile_picture).toEqual('http://')
    expect(nudge.text_input).toEqual({ enabled: true, placeholder: 'Type something' })

    await bubble.nudgeShown(nudge)
    await bubble.nudgeEngage(nudge, { text_input: 'Helloooo' })
  })

  it('receives a nudge on page scroll', async () => {
    jest.setTimeout(15000)

    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    await bubble.connect()
    bubble.sendPageView('https://example.com/scroll-nudge', 'My scroll page')
    bubble.sendPageScroll(95)

    const nudge: Nudge = await new Promise<Nudge>(resolve => {
      bubble.onNudge.subscribe(n => resolve(n))
    })

    expect(nudge.message).toEqual('You scrolled down')

    await bubble.sendChatOpenState(true)
  })
})
