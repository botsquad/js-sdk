import { Push } from 'phoenix'

export function promisify<T>(callback: () => Push) {
  return new Promise<T>((resolve, reject) => {
    callback()
      .receive('ok', resolve)
      .receive('error', ({ reason }: { reason: string }) => {
        reject(new Error(reason))
      })
      .receive('timeout', () => reject('Timeout'))
  })
}
