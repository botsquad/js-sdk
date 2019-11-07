import { ChatBubble } from "../src"


describe("ChatBubble instantiation", () => {

  it("missing required parameters", () => {
    expect(() => new ChatBubble({
      userAgent: '',
      botId: '',
    })).toThrow(/parameter missing/)

    expect(() => new ChatBubble({
      userAgent: 'foo/1.0',
      botId: '',
    })).toThrow(/parameter missing/)
  })

  it("constructor OK", () => {
    expect(new ChatBubble({
      userAgent: 'foo/1.0',
      botId: 'fdsf809ds8f09dsf',
    })).toBeInstanceOf(ChatBubble)
  })

  it("sets default hostname", () => {
    const bubble = new ChatBubble({
      userAgent: 'foo/1.0',
      botId: 'fdsf809ds8f09dsf' })

    expect(bubble.getConfig().hostname).toBe("bsqd.me")
  })

})
