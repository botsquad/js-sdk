import { ChatBubble } from '../src'
import { VALID_JOIN_PARAMS } from './chat_bubble.test'

describe('ChatBubble REST client', () => {
  it('can submit leave message requests and retrieve user info', async () => {
    const bubble = new ChatBubble(VALID_JOIN_PARAMS)
    const result = await bubble.connect()

    const request = {
      user_id: result.userId,
      name: 'Arjan',
      email: 'a@a.nl',
      phone: '31641322333',
      message: 'Hello I just wanted to let you know'
    }

    const info = await bubble.restClient.leaveMessage(VALID_JOIN_PARAMS.botId, request)
    expect(typeof info).toEqual('object')

    const userInfo = await bubble.restClient.getUserInfo(VALID_JOIN_PARAMS.botId, result.userId)
    expect(typeof userInfo).toEqual('object')
    expect(userInfo.user_data?.email).toEqual('a@a.nl')
  })
})
