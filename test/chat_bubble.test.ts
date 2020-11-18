import { ChatBubble } from '../src'
import { Config } from '../src/types'
import 'whatwg-fetch' // polyfill for jest

const USER_AGENT = `botsquad-sdk-testsuite/0.0`

declare global {
  namespace jest {
    interface Matchers<R> {
      toError(value: RegExp): R
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
          userAgent: USER_AGENT,
          botId: ''
        })
    ).toThrow(/parameter missing/)
  })

  it('constructor OK', () => {
    expect(
      new ChatBubble({
        userAgent: USER_AGENT,
        botId: 'fdsf809ds8f09dsf'
      })
    ).toBeInstanceOf(ChatBubble)
  })

  it('sets default hostname', () => {
    const bubble = new ChatBubble({
      userAgent: USER_AGENT,
      botId: 'fdsf809ds8f09dsf'
    })

    expect(bubble.getConfig().hostname).toBe('bsqd.me')
  })
})

export const VALID_JOIN_PARAMS: Config = {
  botId: 'e222b5b3-9d36-4de6-bfc8-ebb93292521d',
  userAgent: USER_AGENT + ' (Android 6.0)',
  hostname: 'staging.bsqd.me'
}

/*
export const VALID_JOIN_PARAMS: Config = {
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
    expect(info.userInfo).toEqual(null)

    expect(info.bot.id).toBe(VALID_JOIN_PARAMS.botId)
    expect(info.bot.title).toBe('JS-SDK Bot')
    expect(info.bot.profilePicture).toMatch(/^https:\/\/s3.eu-west-1.amazonaws.com/)

    expect(bubble.getWebviewUrl()).toMatch(/^https:\/\/cbl.staging.bsqd.me/)
    expect(bubble.getWebviewUrl()).toMatch(/#\/g\/main$/)
    expect(bubble.getWebviewUrl('asdf')).toMatch(/#\/g\/asdf$/)

    await bubble.disconnect()
  })

  it('raises on invalid bot ID', () => {
    const bubble = new ChatBubble({ botId: 'xxxxx', userAgent: 'xxx' })
    return expect(bubble.connect()).rejects.toThrowError(/404/)
  })

  it('raises on invalid user token', () => {
    const bubble = new ChatBubble({ userToken: 'xxxxx', ...VALID_JOIN_PARAMS })
    return expect(bubble.connect()).rejects.toError(/Error decoding/)
  })

  it('can disconnect when not connected', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    await bubble.disconnect()
  })

  it('different bubbles get different tokens', async () => {
    const { userToken: t1 } = await new ChatBubble(VALID_JOIN_PARAMS).connect()
    const { userToken: t2 } = await new ChatBubble(VALID_JOIN_PARAMS).connect()
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

  it('can use userId to connect', async () => {
    const bubble = new ChatBubble({ userId: 'user001', ...VALID_JOIN_PARAMS })

    const { userId, userToken } = await bubble.connect()

    await bubble.disconnect()

    expect(userId).toEqual('user001')
    expect(bubble.getUserId()).toEqual('user001')
  })

  it('uses identical user token every time', async () => {
    let bubble: ChatBubble

    const params = { userId: '12345', ...VALID_JOIN_PARAMS }
    bubble = new ChatBubble(params as Config)
    const { userToken: a } = await bubble.connect()
    await bubble.disconnect()

    bubble = new ChatBubble(params as Config)
    const { userToken: b } = await bubble.connect()
    await bubble.disconnect()

    expect(a).toEqual(b)
  })
})

describe('ChatBubble user info', () => {
  it('can store user info', async () => {
    let bubble: ChatBubble

    bubble = new ChatBubble(VALID_JOIN_PARAMS)
    const { userToken, userInfo } = await bubble.connect()
    expect(userInfo).toEqual(null)

    const result = await bubble.putUserInfo({
      first_name: 'SDK test user',
      last_name: 'Lastname',
      foo: 'bar'
    })

    expect(result.first_name).toEqual('SDK test user')
    expect(result.last_name).toEqual('Lastname')
    expect(result.foo).toEqual('bar')
    expect(result.timezone).toEqual('Europe/Amsterdam')
    expect(result.locale).toEqual('en')

    expect(result).toEqual(bubble.getUserInfo())

    await bubble.disconnect()

    bubble = new ChatBubble({ userToken, ...VALID_JOIN_PARAMS })
    const { userInfo: info } = await bubble.connect()

    expect(info!.first_name).toEqual('SDK test user')
    expect(info!.last_name).toEqual('Lastname')
    expect(info!.foo).toEqual('bar')
  })

  it('can send user info before connect', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    bubble.putUserInfo({ foo: '12345' })
    expect(bubble.getUserInfo()).toEqual(null)

    const { userInfo } = await bubble.connect()
    expect(userInfo!.foo).toEqual('12345')

    expect(bubble.getUserInfo()).toEqual(userInfo)
  })
})

describe('ChatBubble page views', () => {
  it('can send page view', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    await bubble.connect()

    await expect(bubble.sendPageView('https://example.com', 'My first page')).resolves.toEqual({})
    await expect(bubble.sendPageView('xxbla', 'invalid page')).rejects.toError(/Invalid arguments/)
  })

  it('can send page view before connect', async () => {
    expect.assertions(1)

    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    const a = bubble
      .sendPageView('https://example.com', 'My first page')
      .then(result => expect(result).toEqual({}))

    // errors before connect are ignored
    bubble.sendPageView('xxbla', 'invalid page')

    await bubble.connect()

    return a
  })
})

describe('ChatBubble badge count', () => {
  it('badge count callback invoked after subscription', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)

    const info = await bubble.connect()
    expect(typeof info.badgeCount).toBe('number')

    const conversations = await bubble.listConversations()
    expect(conversations).toEqual([])

    return new Promise(resolve => {
      bubble.onBadgeCountUpdate.subscribe(count => {
        expect(typeof count).toBe('number')
        expect(count).toEqual(0)

        resolve()
      })
    })
  })
})
