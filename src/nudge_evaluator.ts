import { Channel, Push } from 'phoenix'
import { Nudge, API } from './types'
import { promisify, Receiveable } from './channel'

type BackendContext = API.VisitorsJoinResponse['context']

interface ChannelLike {
  push<T>(event: string, payload: any): Receiveable<T>
}

type ErrorTracker = { [key: string]: number }

export class NudgeEvaluator {
  private context: Context
  private interval: NodeJS.Timeout | null = null
  public triggeredNudges = new Set<string>()
  public erroredNudges = new Set<string>()
  public errors: ErrorTracker = {}
  private queuedForRemoval = new Set<string>()
  private onStop: (() => void) | null
  private intervalSpeed = 1000

  constructor(
    private channel: ChannelLike,
    private onNudge: (nudge: API.VisitorsNudge) => void,
    public nudges: API.VisitorsJoinResponse['nudges'],
    context: BackendContext,
    onStop: (() => void) | null = null
  ) {
    this.context = new Context(context)
    this.onStop = onStop
  }

  running() {
    return this.interval !== null
  }

  setIntervalSpeed(speed: number) {
    this.intervalSpeed = speed
  }

  start() {
    if (this.nudges.length > 0) {
      this.interval = setInterval(() => this.evaluate(), this.intervalSpeed)
      this.evaluate()
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    if (this.onStop) {
      this.onStop()
    }
  }

  evaluate() {
    if (this.queuedForRemoval.size > 0) {
      this.nudges = this.nudges.filter(n => !this.queuedForRemoval.has(n.id))
      this.queuedForRemoval = new Set<string>()
    }

    if (this.nudges.length === 0) {
      this.stop()
      return
    }

    for (const { id, expr } of this.nudges) {
      const result = nudgeEval(this.context, expr)

      if (result instanceof Error) {
        console.error(result)

        if (!this.errors[id]) this.errors[id] = 0
        ++this.errors[id]

        if (this.errors[id] === 5) {
          // 5 errors for the same nudge and we remove it.
          console.error(`detected 5 errors for ${id}, removing it`)
          this.queuedForRemoval.add(id)
          this.erroredNudges.add(id)
        }

        continue
      }

      if (result) {
        promisify<API.VisitorsNudge | null>(() => this.channel.push('trigger-nudge', { id }))
          .then(response => {
            if (response) {
              this.onNudge(response)
            }
            this.queuedForRemoval.add(id)
            this.triggeredNudges.add(id)
          })
          .catch((reason) => {
            console.error(reason)
            this.queuedForRemoval.add(id)
            this.erroredNudges.add(id)
          })
      }
    }

  }
}

export class Context {
  private pageTimeStart: Date
  private backendContext: BackendContext
  private location: Location | null

  constructor(
    backendContext: BackendContext,
    pageTimeStart: Date | null = null,
    location: Location | null = null
  ) {
    this.backendContext = backendContext
    this.pageTimeStart = pageTimeStart || new Date()
    this.location = location
  }

  get page() {
    const loc = this.location || window.location

    return {
      title: document.title,
      url: loc.href,
      fragment: loc.hash,
      hash: loc.hash,
      host: loc.host,
      path: loc.pathname,
      scheme: loc.protocol,
      query: loc.search.substring(1),

      get params() {
        const params = new URLSearchParams(loc.search)

        return new Proxy(params, {
          get(obj, prop) {
            if (typeof prop === 'string') {
              return obj.get(prop)
            }
            return null
          }
        })
      },

      get scroll() {
        const h = document.documentElement
        const b = document.body
        const st = 'scrollTop'
        const sh = 'scrollHeight'

        const top = h[st] || b[st]
        const height = h[sh] || b[sh]

        return top / (height - h.clientHeight) * 100
      },
    }
  }

  get visitor() {
    const inserted_at = this.backendContext.visitor.inserted_at

    return {
      ...this.backendContext.visitor,

      get returning(): boolean {
        const insertedAt = Date.parse(inserted_at)
        const now = new Date()

        // diff(now, inserted_at, :hours) >= 4
        return ((now.getTime() - insertedAt) / 1000 / 60 / 60) >= 4
      }
    }
  }

  get ab() {
    return this.backendContext.ab
  }

  get time_on_page() {
    const now = new Date()
    return (now.getTime() - this.pageTimeStart.getTime()) / 1000
  }

  get within_office_hours() {
    const now = new Date()
    const dayIndex = now.getDay()
    const [start, end] = this.backendContext.office_hours[dayIndex] || [null, null]

    if (start === null || end === null) {
      return false
    }

    const startDate = officeHourTimeToDate(now, start)
    const endDate = officeHourTimeToDate(now, end)

    return startDate.getTime() <= now.getTime() && now.getTime() <= endDate.getTime()
  }
}

function officeHourTimeToDate(now: Date, time: string): Date {
  const [startHour, startMinute] = time.split(':')

  const clone = new Date(now.getTime())
  clone.setHours(parseInt(startHour))
  clone.setMinutes(parseInt(startMinute))
  clone.setSeconds(0)
  clone.setMilliseconds(0)

  return clone
}

type NonEmptyList<T> = [T, ...T[]]
type UnaryOp = '!' | '!!'
type BinaryOp = '==' | '!=' | '>=' | '>' | '<' | '<=' | '=~' | 'and' | 'or'
type VarExpr = ['var', NonEmptyList<string>]
type Scalar = boolean | number | string | null

export type Expr = VarExpr | [UnaryOp, Expr] | [BinaryOp, Expr, Expr] | Scalar

export function nudgeEval(context: Context, expr: Expr): boolean | Error {
  try {
    return !!evalChild(context, expr)
  } catch (err) {
    return err instanceof Error
      ? err
      : typeof err === 'string' ? new Error(err) : new Error('Unexpected error')
  }
}

function isScalar(expr: Expr): expr is Scalar {
  return typeof expr === 'boolean' || typeof expr === 'number' || typeof expr === 'string' || expr === null
}

function evalChild(context: Context, expr: Expr): any {
  if (isScalar(expr)) {
    return expr
  }

  switch (expr[0]) {
    case 'var': return getIn(context, expr[1])
    case '!': return !evalChild(context, expr[1])
    case '!!': return !!evalChild(context, expr[1])
    case '==': return evalChild(context, expr[1]) === evalChild(context, expr[2])
    case '!=': return evalChild(context, expr[1]) !== evalChild(context, expr[2])
    case '>=': return evalChild(context, expr[1]) >= evalChild(context, expr[2])
    case '>': return evalChild(context, expr[1]) > evalChild(context, expr[2])
    case '<': return evalChild(context, expr[1]) < evalChild(context, expr[2])
    case '<=': return evalChild(context, expr[1]) <= evalChild(context, expr[2])
    case '=~': return match(evalChild(context, expr[1]), evalChild(context, expr[2]))
    case 'and': return evalChild(context, expr[1]) && evalChild(context, expr[2])
    case 'or': return evalChild(context, expr[1]) || evalChild(context, expr[2])
    default: throw new Error(`unexpected operator ${expr[0]}`)
  }
}

function getIn(context: Context, path: NonEmptyList<string>) {
  let value: any = context
  for (const key of path) {
    value = value[key]
    if (!value) return null
  }
  return value
}

function match(lhs: any, rhs: any): boolean {
  return typeof lhs === 'string' &&
    typeof rhs === 'string' &&
    lhs.toLowerCase().includes(rhs.toLowerCase())
}
