export const REALTIME_EVENT_ID_LIMIT = 256;

export const isRealtimeEnabled = () =>
  process.env.NEXT_PUBLIC_REALTIME_ENABLED?.trim().toLowerCase() !== "false";

export class BoundedEventIdSet {
  private readonly idsByScope = new Map<string, Map<string, true>>();

  constructor(private readonly limit = REALTIME_EVENT_ID_LIMIT) {}

  accept(scope: string, eventId: unknown): boolean {
    if (typeof eventId !== "string" || eventId.length === 0) return true;

    let ids = this.idsByScope.get(scope);
    if (!ids) {
      ids = new Map<string, true>();
      this.idsByScope.set(scope, ids);
    }

    if (ids.has(eventId)) return false;

    ids.set(eventId, true);
    while (ids.size > this.limit) {
      const oldest = ids.keys().next().value;
      if (oldest === undefined) break;
      ids.delete(oldest);
    }
    return true;
  }

  clear(scope?: string) {
    if (scope) {
      this.idsByScope.delete(scope);
      return;
    }
    this.idsByScope.clear();
  }
}

export const withoutEventId = <T extends Record<string, unknown>>(payload: T) => {
  const { eventId: _eventId, ...value } = payload;
  void _eventId;
  return value;
};
