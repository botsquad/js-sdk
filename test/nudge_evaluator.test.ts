/**
 * @jest-environment jsdom
 */

import { assert } from 'chai'
import { nudgeEval, Context, NudgeEvaluator } from '../src/nudge_evaluator'
import type { API } from '../src/types'

const DEFAULT_BACKEND_CONTEXT = {
  ab: 40,
  office_hours: [
    [null, null],
    ['09:00', '17:00'],
    ['09:00', '17:00'],
    ['09:00', '17:00'],
    ['09:00', '17:00'],
    ['09:00', '17:00'],
    [null, null],
  ] as API.OfficeHours[],
  visitor: {
    inserted_at: new Date(new Date().getTime() - (1000 * 60 * 60 * 5)).toISOString(),
    timezone: 'Europe/Amsterdam',
    locale: 'en'
  }
}

const context = new Context(DEFAULT_BACKEND_CONTEXT)

describe('nudgeEval', function() {
  it('scalars as boolean', function() {
    assert.isTrue(nudgeEval(context, true))
    assert.isFalse(nudgeEval(context, false))
    assert.isFalse(nudgeEval(context, null))
  })

  it('operators', function() {
    assert.isTrue(nudgeEval(context, ['!', false]))
    assert.isFalse(nudgeEval(context, ['!', true]))

    assert.isTrue(nudgeEval(context, ['!!', true]))
    assert.isFalse(nudgeEval(context, ['!!', false]))

    assert.isTrue(nudgeEval(context, ['==', 5, 5]))
    assert.isFalse(nudgeEval(context, ['==', 5, 6]))

    assert.isTrue(nudgeEval(context, ['!=', 5, 6]))
    assert.isFalse(nudgeEval(context, ['!=', 5, 5]))

    assert.isFalse(nudgeEval(context, ['>', 5, 6]))
    assert.isFalse(nudgeEval(context, ['>', 5, 5]))
    assert.isTrue(nudgeEval(context, ['>', 5, 4]))

    assert.isFalse(nudgeEval(context, ['>=', 5, 6]))
    assert.isTrue(nudgeEval(context, ['>=', 5, 5]))
    assert.isTrue(nudgeEval(context, ['>=', 5, 4]))

    assert.isTrue(nudgeEval(context, ['<', 5, 6]))
    assert.isFalse(nudgeEval(context, ['<', 5, 5]))
    assert.isFalse(nudgeEval(context, ['<', 5, 4]))

    assert.isTrue(nudgeEval(context, ['<=', 5, 6]))
    assert.isTrue(nudgeEval(context, ['<=', 5, 5]))
    assert.isFalse(nudgeEval(context, ['<=', 5, 4]))

    assert.isTrue(nudgeEval(context, ['=~', '/about/me', 'about']))
    assert.isFalse(nudgeEval(context, ['=~', 'hello', 'world']))
    assert.isFalse(nudgeEval(context, ['=~', 'hello', 5]))
    assert.isFalse(nudgeEval(context, ['=~', 5, 'world']))

    assert.isTrue(nudgeEval(context, ['and', true, true]))
    assert.isFalse(nudgeEval(context, ['and', true, false]))

    assert.isTrue(nudgeEval(context, ['or', true, false]))
    assert.isFalse(nudgeEval(context, ['or', false, false]))
  })

  it('executes var', function() {
    assert.isTrue(nudgeEval(context, ['var', ['visitor', 'returning']]))
    assert.isTrue(nudgeEval(context, ['==', ['var', ['visitor', 'returning']], true]))
    assert.isTrue(nudgeEval(context, ['==', ['var', ['visitor', 'timezone']], "Europe/Amsterdam"]))
  })

  it('time_on_page', function() {
    // Pretend we opened the page 10 seconds ago.
    const tenSecondsAgo = new Date(new Date().getTime() - 10000)
    const pastContext = new Context(DEFAULT_BACKEND_CONTEXT, tenSecondsAgo)

    assert.isTrue(nudgeEval(pastContext, ['>', ['var', ['time_on_page']], 6]))
    assert.isFalse(nudgeEval(context, ['>', ['var', ['time_on_page']], 6]))
  })

  it('evaluates page vars', function() {
    assert.isTrue(nudgeEval(context, ['==', ['var', ['page', 'path']], '/']))
    assert.isTrue(nudgeEval(context, ['==', ['var', ['page', 'params', 'utm']], null]))

    const location = { ...window.location, search: '?utm=google' }
    const newContext = new Context(DEFAULT_BACKEND_CONTEXT, null, location)

    assert.isTrue(nudgeEval(newContext, ['==', ['var', ['page', 'params', 'utm']], 'google']))
  })

  it('within_office_hours', function() {
    const officeHours = [
      ['00:00', '23:59'],
      ['00:00', '23:59'],
      ['00:00', '23:59'],
      ['00:00', '23:59'],
      ['00:00', '23:59'],
      ['00:00', '23:59'],
      ['00:00', '23:59'],
    ] as any

    const backendContext = { ...DEFAULT_BACKEND_CONTEXT, office_hours: officeHours }
    const context = new Context(backendContext)

    assert.isTrue(nudgeEval(context, ['var', ['within_office_hours']]))
  })

  it('ab', function() {
    assert.equal(context.ab, 40)
    assert.isTrue(nudgeEval(context, ['>', ['var', ['ab']], 30]))
    assert.isFalse(nudgeEval(context, ['>', ['var', ['ab']], 60]))
  })
})

type MockedResponse<T> = ['ok', [T]] | ['error', [{ reason: string }]] | ['timeout', []]

class MockPush<T> {
  private onOk: ((value: T) => void) | null = null
  private onErr: ((value: { reason: string }) => void) | null = null
  private onTimeout: (() => void) | null = null
  private mockedResponse: MockedResponse<T> | null = null

  receive(event: string, callback: any) {
    switch (event) {
      case 'ok':
        this.onOk = callback
        break

      case 'error':
        this.onErr = callback
        break

      case 'timeout':
        this.onTimeout = callback
        break

      default:
        throw new Error('Undefined event')
    }

    if (this.mockedResponse && this.mockedResponse[0] === event) {
      callback(...this.mockedResponse[1])
    }

    return this
  }

  ok(value: T) {
    this.mockedResponse = ['ok', [value]]
    this.onOk?.(value)
  }

  err(reason: string) {
    this.mockedResponse = ['error', [{ reason }]]
    this.onErr?.({ reason })
  }

  timeout() {
    this.mockedResponse = ['timeout', []]
    this.onTimeout?.()
  }
}

class MockChannel {
  constructor(
    private onPush: (event: string, payload: any, push: MockPush<any>) => any = () => {}
  ) {}

  push<T>(event: string, payload: any): MockPush<T> {
    const push = new MockPush<T>()
    this.onPush(event, payload, push)
    return push
  }
}

const alwaysTimeoutChannel = new MockChannel((_event, _payload, push) => {
  push.timeout()
})

describe('NudgeEvaluator', function () {
  it('does nothing when there are no nudges', function () {
    const e = new NudgeEvaluator(alwaysTimeoutChannel, () => {}, [], DEFAULT_BACKEND_CONTEXT)
    assert.isFalse(e.running())
    e.start()
    assert.isFalse(e.running())
  })

  it('evaluates nudges', function () {
    return new Promise<void>((resolve, reject) => {
      const timerNudge = {
        id: 'timer-nudge',
        expr: ['>', ['var', ['time_on_page']], 0.1] as any,
      }

      const instantNudge = {
        id: 'instant-nudge',
        expr: true
      }

      const channel = new MockChannel((event, payload, push: MockPush<API.VisitorsNudge | null>) => {
        assert.equal(event, 'trigger-nudge')
        push.ok({ id: payload.id, title: 'Title', json: '{}' })
      })

      let evaluator: NudgeEvaluator

      const onNudge = (nudge: API.VisitorsNudge) => {
        assert.equal(nudge.title, 'Title')

        if (nudge.id === 'timer-nudge') {
          assert.equal(evaluator.triggeredNudges.size, 1)
          assert(evaluator.triggeredNudges.has('instant-nudge'))
          assert.equal(evaluator.nudges.length, 1, 'the instant-nudge was removed earlier')

          resolve()
        }
      }

      const nudges = [timerNudge, instantNudge]
      evaluator = new NudgeEvaluator(channel, onNudge, nudges, DEFAULT_BACKEND_CONTEXT)
      assert.isFalse(evaluator.running())
      evaluator.setIntervalSpeed(50)
      evaluator.start()
      assert.isTrue(evaluator.running())
    })
  })

  it('discards nudges that returned an error from the server', async function() {
    jest.spyOn(console, 'error').mockImplementation(() => {})

    const evaluator = await new Promise<NudgeEvaluator>((resolve, reject) => {
      const channel = new MockChannel((_event, _payload, push) => {
        push.err('nudge not found')
      })

      const onNudge = () => {
        assert.fail('onNudge should not have been called')
        reject()
      }

      const nudge = { id: 'example', expr: true }

      const evaluator = new NudgeEvaluator(channel, onNudge, [nudge], DEFAULT_BACKEND_CONTEXT, () => {
        resolve(evaluator)
      })
      evaluator.setIntervalSpeed(50)
      evaluator.start()
    })

    assert.isTrue(evaluator.erroredNudges.has('example'))
  })

  it('removes a nudge if it fails many times', async function() {
    jest.spyOn(console, 'error').mockImplementation(() => {})

    const evaluator = await new Promise<NudgeEvaluator>((resolve, reject) => {
      // The nudge eval should ALWAYS fails, so receiving a nudge would be incorrect.
      const channel = new MockChannel(() => {
        reject()
      })
      const onNudge = () => reject()
      const nudge = { id: 'example', expr: ['not an operator', true, true] as any }

      const evaluator = new NudgeEvaluator(channel, onNudge, [nudge], DEFAULT_BACKEND_CONTEXT, () => {
        resolve(evaluator)
      })
      evaluator.setIntervalSpeed(20)
      evaluator.start()
    })

    assert.equal(evaluator.errors.example, 5)
    assert.isTrue(evaluator.erroredNudges.has('example'))
    assert.isTrue(evaluator.nudges.length === 0)
    assert.isFalse(evaluator.running())
  })
})
