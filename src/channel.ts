// Don't just use phoenix.Push so we can mock this more easily in tests.
export interface Receiveable<T> {
  receive(event: 'ok', callback: (result: T) => void): Receiveable<T>
  receive(event: 'error', callback: (err: { reason: string }) => void): Receiveable<T>
  receive(event: 'timeout', callback: () => void): Receiveable<T>
}

export function promisify<T>(callback: () => Receiveable<T>) {
  return new Promise<T>((resolve, reject) => {
    callback()
      .receive('ok', resolve)
      .receive('error', ({ reason }) => {
        reject(new Error(reason))
      })
      .receive('timeout', () => reject('Timeout'))
  })
}
