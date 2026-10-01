import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('window.onerror = function'), html.indexOf('</script>', html.indexOf('window.onerror = function')));

function fixture() {
  const nodes = new Map();
  let reloads = 0, clears = 0;
  const body = { children: [], appendChild(node) { this.children.push(node); if (node.id) nodes.set(node.id, node); } };
  const document = {
    body, getElementById: id => nodes.get(id),
    createElement: tag => ({ tag, style: {}, children: [], events: {},
      setAttribute(key, value) { this[key] = value; },
      appendChild(child) { this.children.push(child); },
      addEventListener(name, action) { this.events[name] = action; }
    })
  };
  const window = { location: { reload() { reloads++; } }, strokeAppStorage: { clearAppStorage() { clears++; } } };
  const context = { window, document, console: { error() {} } };
  for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(context, key, { get() { throw Error('Storage must not be touched during error recovery'); } });
  vm.runInNewContext(source, context);
  return { window, body, get reloads() { return reloads; }, get clears() { return clears; } };
}

describe('non-destructive runtime error recovery', () => {
  it.each(['undefined value', 'handler is not a function', 'unexpected failure'])('preserves an active encounter after %s', message => {
    const f = fixture();
    expect(() => f.window.onerror(message)).not.toThrow();
    expect(f.reloads).toBe(0);
    expect(f.clears).toBe(0);
    expect(f.body.children[0].role).toBe('alert');
    expect(f.body.children[0].children[0].textContent).toContain('unsaved inputs will be lost');
  });
  it('deduplicates repeated errors and reloads only after the explicit action', () => {
    const f = fixture();
    f.window.onerror('undefined'); f.window.onerror('undefined');
    expect(f.body.children).toHaveLength(1);
    expect(f.reloads).toBe(0);
    f.body.children[0].children[1].events.click();
    expect(f.reloads).toBe(1);
    expect(f.clears).toBe(0);
  });
});
