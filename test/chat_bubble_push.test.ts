import { ChatBubble, PushService } from '../src'
import { VALID_JOIN_PARAMS } from './chat_bubble.test'

describe('ChatBubble push notifications', () => {
  it('can register an Expo push token', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    const r = bubble
      .registerPushToken(PushService.EXPO, 'xx')
      .then(r => expect(r).toEqual({ result: 'OK' }))

    await bubble.connect()

    return r
  })

  it('can register a Pushwoosh token', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    await bubble.connect()
    //    await bubble.putUserInfo({ first_name: "Pushwoosh user" })

    //    console.log('1', 1)

    const r = await bubble.registerPushToken(PushService.PUSHWOOSH, 'xx')
    expect(r.result).toEqual('OK')
  })
})
