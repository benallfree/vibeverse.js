export type EventHandler<T> = (data: T) => void
export type EventSubscriber<T> = (handler: EventHandler<T>) => () => void
export type EventEmitter<T> = (data: T) => void
export type Event<T> = [EventSubscriber<T>, EventEmitter<T>]

export const createEvent = <T>(): Event<T> => {
  const handlers = new Set<EventHandler<T>>()

  return [
    (handler: EventHandler<T>) => {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    (data: T) => {
      handlers.forEach((handler) => handler(data))
    },
  ]
}
