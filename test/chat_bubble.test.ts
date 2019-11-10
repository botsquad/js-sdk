import { ChatBubble } from '../src'
import { Config, Nudge, PushService } from '../src/types'
import 'whatwg-fetch' // polyfill for jest

declare global {
  namespace jest {
    interface Matchers<R> {
      toError(value: RegExp): R;
    }
  }
}

Object.assign(expect).extend({
  toError(received: any, match: RegExp) {
    const pass = !!(received instanceof Error && received.message.match(match))
    return {
      pass,
      message: () => `expected an Error with message ${match}, got: ${received}`
    }
  }
})

describe('ChatBubble instantiation', () => {
  it('missing required parameters', () => {
    expect(
      () =>
        new ChatBubble({
          userAgent: '',
          botId: ''
        })
    ).toThrow(/parameter missing/)

    expect(
      () =>
        new ChatBubble({
          userAgent: 'foo/1.0',
          botId: ''
        })
    ).toThrow(/parameter missing/)
  })

  it('constructor OK', () => {
    expect(
      new ChatBubble({
        userAgent: 'foo/1.0',
        botId: 'fdsf809ds8f09dsf'
      })
    ).toBeInstanceOf(ChatBubble)
  })

  it('sets default hostname', () => {
    const bubble = new ChatBubble({
      userAgent: 'foo/1.0',
      botId: 'fdsf809ds8f09dsf'
    })

    expect(bubble.getConfig().hostname).toBe('bsqd.me')
  })
})


const VALID_JOIN_PARAMS: Config = {
  botId: 'e222b5b3-9d36-4de6-bfc8-ebb93292521d',
  userAgent: 'foo/1.0 (Android 6.0)',
  hostname: 'staging.bsqd.me'
}

/*
const VALID_JOIN_PARAMS: Config = {
  botId: '40d700a7-e643-43bf-a377-acab46ee9991',
  userAgent: 'foo/1.0 (Android 6.0)',
  hostname: 'localhost:4000',
  secure: false
}
*/

describe('ChatBubble connection', () => {
  it('can connect', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    const info = await bubble.connect()

    expect(typeof info.badgeCount).toBe('number')
    expect(typeof info.userToken).toBe('string')

    expect(info.bot.id).toBe(VALID_JOIN_PARAMS.botId)
    expect(info.bot.title).toBe('JS-SDK Bot')
    expect(info.bot.profilePicture).toMatch(/^https:\/\/s3.eu-west-1.amazonaws.com/)

    expect(bubble.getWebviewUrl()).toMatch(/^https:\/\/cbl.staging.bsqd.me/)

    await bubble.disconnect()
  })

  it('raises on invalid bot ID', () => {
    const bubble = new ChatBubble({ botId: 'xxxxx', userAgent: 'xxx' })
    return expect(bubble.connect()).rejects.toThrowError(/404/)
  })

  it('raises on invalid user token', () => {
    const bubble = new ChatBubble({ userToken: "xxxxx", ...VALID_JOIN_PARAMS })
    return expect(bubble.connect()).rejects.toError(/Error decoding/)
  })

  it('can disconnect when not connected', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    await bubble.disconnect()
  })

  it('different bubbles get different tokens', async () => {
    const { userToken: t1 } = await (new ChatBubble(VALID_JOIN_PARAMS)).connect()
    const { userToken: t2 } = await (new ChatBubble(VALID_JOIN_PARAMS)).connect()
    expect(t1).not.toEqual(t2)
  })

  it('reuses the user token that it gets the first time', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    const { userToken } = await bubble.connect()
    await bubble.disconnect()

    const bubble2 = new ChatBubble({ userToken, ...VALID_JOIN_PARAMS })
    const { userToken: token2 } = await bubble2.connect()

    expect(userToken).toEqual(token2)
  })

  it('can send page view', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    await bubble.connect()

    await expect(bubble.sendPageView('https://example.com', 'My first page')).resolves.toEqual({})
    await expect(bubble.sendPageView('xxbla', 'invalid page')).rejects.toError(/Invalid arguments/)
  })

  it('can send page view before connect', async () => {
    expect.assertions(2)

    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    const a = bubble.sendPageView('https://example.com', 'My first page').then(
      result => expect(result).toEqual({}))

    const b = bubble.sendPageView('xxbla', 'invalid page').catch(
      error => expect(error).toError(/Invalid arguments/))

    await bubble.connect()

    return Promise.all([a, b])
  })

})

describe('ChatBubble push notifications', () => {
  it('can register a push token', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    const r = bubble.registerPushToken(PushService.EXPO, 'xx').then(
      r => expect(r).toEqual({ result: "OK"}))

    await bubble.connect()

    return r
  })
})

describe('ChatBubble nudges', () => {
  it('can receive and engage with nudges', async () => {
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
