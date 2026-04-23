const listeners = new Set<() => void>();

export function emitNotificationsChanged() {
  for (const listener of listeners) listener();
}

export function subscribeToNotificationsChanged(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
