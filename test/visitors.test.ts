/**
 * @jest-environment jsdom
 */

import { assert } from 'chai'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { Visitors } from '../src/visitors'
import { API } from '../src/types'
import type { Nudge, Event } from '../src/types'

// Shape as sent by BotsiWeb.VisitorChannel on join
const JOIN_RESPONSE: API.VisitorsJoinResponse = {
  visitor_id: 'visitor',
  user_id: 'user',
  nudges: [
    {
      id: 'welkom_homepage_na_3_sec',
      expr: true,
      nudge: {
        contents: {
          caption: { $i18n: true, en: 'Welcome 👋', nl: 'Welkom 👋' },
          message: { $i18n: true, en: '**Hello!**', nl: '**Hallo!**' },
        },
        expr: 'page.path == "/" && time_on_page > 3',
        id: 'welkom_homepage_na_3_sec',
        title: 'Welkom homepage na 3 seconden',
      },
    },
  ],
  context: {
    ab: 40,
    office_hours: [],
    visitor: { inserted_at: new Date().toISOString(), timezone: null, locale: 'nl' },
  },
}

function fakeSocket(joinResponse: API.VisitorsJoinResponse): any {
  const push = {
    receive(event: string, callback: (result: any) => void) {
      if (event === 'ok') callback(joinResponse)
      return push
    },
  }
  const channel = { onClose() {}, on() {}, join: () => push, push: () => push }
  return { channel: () => channel }
}

describe('Visitors.Manager', function () {
  beforeEach(function () {
    localStorage.clear()
  })

  it('dispatches inline nudges from the join response', async function () {
    const onNudge = new SimpleEventDispatcher<Nudge>()
    const received: Nudge[] = []
    onNudge.subscribe(n => received.push(n))

    const manager = new Visitors.Manager(
      fakeSocket(JOIN_RESPONSE),
      { botId: 'bot' } as any,
      {} as any,
      onNudge,
      new SimpleEventDispatcher<Event>(),
    )
    await manager.join()

    assert.equal(received.length, 1)
    assert.equal(received[0].id, 'welkom_homepage_na_3_sec')
    assert.equal(received[0].title, 'Welkom homepage na 3 seconden')
    assert.deepEqual(received[0].caption as any, { $i18n: true, en: 'Welcome 👋', nl: 'Welkom 👋' })
    assert.isNull(localStorage.getItem('dialox.handledNudges'))

    ;(manager as any).nudgeEvaluator.stop()
  })

  for (const action of [API.NudgeResponse.ENGAGE, API.NudgeResponse.DISCARD]) {
    it(`persists the nudge to localStorage on ${action}`, async function () {
      const onNudge = new SimpleEventDispatcher<Nudge>()
      const received: Nudge[] = []
      onNudge.subscribe(n => received.push(n))

      const manager = new Visitors.Manager(
        fakeSocket(JOIN_RESPONSE),
        { botId: 'bot' } as any,
        {} as any,
        onNudge,
        new SimpleEventDispatcher<Event>(),
      )
      await manager.join()
      await manager.nudgeResponse(received[0], action)

      assert.deepEqual(JSON.parse(localStorage.getItem('dialox.handledNudges')!), [
        'welkom_homepage_na_3_sec',
      ])

      ;(manager as any).nudgeEvaluator.stop()
    })
  }

  it('does not persist the nudge to localStorage on show', async function () {
    const onNudge = new SimpleEventDispatcher<Nudge>()
    const received: Nudge[] = []
    onNudge.subscribe(n => received.push(n))

    const manager = new Visitors.Manager(
      fakeSocket(JOIN_RESPONSE),
      { botId: 'bot' } as any,
      {} as any,
      onNudge,
      new SimpleEventDispatcher<Event>(),
    )
    await manager.join()
    await manager.nudgeResponse(received[0], API.NudgeResponse.SHOW)

    assert.isNull(localStorage.getItem('dialox.handledNudges'))

    ;(manager as any).nudgeEvaluator.stop()
  })
})
