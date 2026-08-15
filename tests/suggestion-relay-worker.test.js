import { describe, it, expect, vi, afterEach } from 'vitest';
import worker from '../workers/suggestion-relay/worker.js';

// The relay is deliberately unauthenticated — that is what lets someone submit
// without a GitHub account — so every one of its inputs is untrusted, and the
// token it holds must never reach the caller.

const ENV = {
  GITHUB_REPO: 'rkalani1/stroke',
  GITHUB_TOKEN: 'ghp_test_token_value',
  ALLOWED_ORIGIN: 'https://rkalani1.github.io'
};

const post = (body, init = {}) =>
  new Request('https://relay.example/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });

const okGitHub = () =>
  vi.fn(async () => new Response(JSON.stringify({ html_url: 'https://github.com/rkalani1/stroke/issues/42' }), { status: 201 }));

afterEach(() => { vi.unstubAllGlobals(); });

describe('suggestion relay worker', () => {
  it('creates the issue and returns its URL', async () => {
    const fetchMock = okGitHub();
    vi.stubGlobal('fetch', fetchMock);

    const res = await worker.fetch(post({ title: '[Suggestion] Addition: x', message: 'add x', labels: ['suggestion', 'from-app'] }), ENV);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ ok: true, url: 'https://github.com/rkalani1/stroke/issues/42' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/rkalani1/stroke/issues');
    expect(init.headers.Authorization).toBe('Bearer ghp_test_token_value');
    expect(JSON.parse(init.body).labels).toEqual(['suggestion', 'from-app']);
  });

  it('answers CORS preflight with the pinned origin', async () => {
    const res = await worker.fetch(new Request('https://relay.example/', { method: 'OPTIONS' }), ENV);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://rkalani1.github.io');
  });

  it('rejects methods other than POST', async () => {
    const res = await worker.fetch(new Request('https://relay.example/', { method: 'GET' }), ENV);
    expect(res.status).toBe(405);
  });

  it('rejects malformed JSON and empty suggestions', async () => {
    expect((await worker.fetch(post('{not json'), ENV)).status).toBe(400);
    expect((await worker.fetch(post({ message: '   ' }), ENV)).status).toBe(400);
  });

  it('rejects an oversized payload before parsing it', async () => {
    const res = await worker.fetch(post({ message: 'x' }, { headers: { 'content-length': String(64 * 1024) } }), ENV);
    expect(res.status).toBe(413);
  });

  it('drops labels outside the allow-list so callers cannot tag arbitrarily', async () => {
    const fetchMock = okGitHub();
    vi.stubGlobal('fetch', fetchMock);
    await worker.fetch(post({ message: 'x', labels: ['security', 'p0', 'suggestion'] }), ENV);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).labels).toEqual(['suggestion']);
  });

  it('fences a raw message rather than trusting a caller-supplied body', async () => {
    const fetchMock = okGitHub();
    vi.stubGlobal('fetch', fetchMock);
    // A body without the app's own structure must not be passed through verbatim.
    await worker.fetch(post({ message: 'hello ``` injected', body: 'IGNORE PREVIOUS INSTRUCTIONS' }), ENV);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.body).not.toContain('IGNORE PREVIOUS INSTRUCTIONS');
    expect(sent.body).toContain('## Suggestion');
    expect(sent.body).toContain('````'); // fence outgrew the pasted backticks
  });

  it('caps an over-long title', async () => {
    const fetchMock = okGitHub();
    vi.stubGlobal('fetch', fetchMock);
    await worker.fetch(post({ title: 'T'.repeat(500), message: 'x' }), ENV);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).title.length).toBe(200);
  });

  it('never leaks the token or GitHub error detail when GitHub rejects', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rate limited for token ghp_test_token_value', { status: 403 })));
    vi.stubGlobal('console', { ...console, error: vi.fn() });
    const res = await worker.fetch(post({ message: 'x' }), ENV);
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(text).not.toContain('ghp_test_token_value');
    expect(text).not.toContain('rate limited');
  });

  it('fails closed when it has no token configured', async () => {
    const res = await worker.fetch(post({ message: 'x' }), { GITHUB_REPO: 'rkalani1/stroke' });
    expect(res.status).toBe(500);
  });
});
