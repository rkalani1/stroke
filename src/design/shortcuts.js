// Global search shortcuts, kept pure so the guard can be tested without the app shell.
// Ctrl/⌘ K opens search from anywhere, except that macOS and iPadOS leave Control+K to a text
// field (it deletes to the end of the line there). There is no single-character shortcut: a bare
// key such as "/" could not be turned off or remapped (WCAG 2.1.4). A key another handler already
// consumed, and keys pressed while an IME is composing, are left alone.
export const isTextEntry = target => Boolean(target && target.nodeType === 1 && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)));

export function opensSearch(event, { macLike = false } = {}) {
  if (!event || event.defaultPrevented || event.isComposing) return false;
  const typing = isTextEntry(event.target);
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && String(event.key || '').toLowerCase() === 'k') return !(typing && macLike && event.ctrlKey && !event.metaKey);
  return false;
}
