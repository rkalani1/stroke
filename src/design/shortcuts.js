// Global search shortcuts, kept pure so the guard can be tested without the app shell.
// Ctrl/⌘ K opens search from anywhere, except that macOS and iPadOS leave Control+K to a text
// field (it deletes to the end of the line there). "/" opens search only when focus is not in a
// form control, so typing "172/94" or a date never opens it. A key another handler already
// consumed, and keys pressed while an IME is composing, are left alone.
export const isTextEntry = target => Boolean(target && target.nodeType === 1 && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)));

export function opensSearch(event, { macLike = false } = {}) {
  if (!event || event.defaultPrevented || event.isComposing) return false;
  const typing = isTextEntry(event.target);
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && String(event.key || '').toLowerCase() === 'k') return !(typing && macLike && event.ctrlKey && !event.metaKey);
  return event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey;
}
