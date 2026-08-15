import { describe, it, expect, vi, afterEach } from 'vitest';
import worker from '../workers/suggestion-relay/worker.js';

// The relay is deliberately unauthenticated — that is what lets someone submit
// without a GitHub account — so every one of its inputs is untrusted, and the
// token it holds must never reach the caller.

// Full deployment: both deliveries configured.
const ENV = {
  GITHUB_REPO: 'rkalani1/stroke',
  GITHUB_TOKEN: 'ghp_test_token_value',
  ALLOWED_ORIGIN: 'https://rkalani1.github.io',
  NOTIFY_EMAIL: 'rkalani@uw.edu',
  RESEND_API_KEY: 're_test_key_value'
};

// GitHub-only deployment. The request-handling tests below use this so the
// single outbound call is unambiguously the GitHub one.
const GH_ONLY = {
  GITHUB_REPO: 'rkalani1/stroke',
  GITHUB_TOKEN: 'ghp_test_token_value',
  ALLOWED_ORIGIN: 'https://rkalani1.github.io'
};

/** Route the two outbound calls the worker can make. */
const routed = ({ mailOk = true, ghOk = true } = {}) =>
  vi.fn(async (url) => {
    if (String(url).includes('resend.com')) {
      return new Response(mailOk ? '{}' : 'mail rejected for re_test_key_value', { status: mailOk ? 200 : 422 });
    }
    return ghOk
      ? new Response(JSON.stringify({ html_url: 'https://github.com/rkalani1/stroke/issues/42' }), { status: 201 })
      : new Response('gh error mentioning ghp_test_token_value', { status: 403 });
  });

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

    const res = await worker.fetch(post({ title: '[Suggestion] Addition: x', message: 'add x', labels: ['suggestion', 'from-app'] }), GH_ONLY);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ ok: true, url: 'https://github.com/rkalani1/stroke/issues/42', emailed: false });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/rkalani1/stroke/issues');
    expect(init.headers.Authorization).toBe('Bearer ghp_test_token_value');
    expect(JSON.parse(init.body).labels).toEqual(['suggestion', 'from-app']);
  });

  it('answers CORS preflight with the pinned origin', async () => {
    const res = await worker.fetch(new Request('https://relay.example/', { method: 'OPTIONS' }), GH_ONLY);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://rkalani1.github.io');
  });

  it('rejects methods other than POST', async () => {
    const res = await worker.fetch(new Request('https://relay.example/', { method: 'GET' }), GH_ONLY);
    expect(res.status).toBe(405);
  });

  it('rejects malformed JSON and empty suggestions', async () => {
    expect((await worker.fetch(post('{not json'), GH_ONLY)).status).toBe(400);
    expect((await worker.fetch(post({ message: '   ' }), GH_ONLY)).status).toBe(400);
  });

  it('rejects an oversized payload before parsing it', async () => {
    const res = await worker.fetch(post({ message: 'x' }, { headers: { 'content-length': String(64 * 1024) } }), GH_ONLY);
    expect(res.status).toBe(413);
  });

  it('drops labels outside the allow-list so callers cannot tag arbitrarily', async () => {
    const fetchMock = okGitHub();
    vi.stubGlobal('fetch', fetchMock);
    await worker.fetch(post({ message: 'x', labels: ['security', 'p0', 'suggestion'] }), GH_ONLY);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).labels).toEqual(['suggestion']);
  });

  it('fences a raw message rather than trusting a caller-supplied body', async () => {
    const fetchMock = okGitHub();
    vi.stubGlobal('fetch', fetchMock);
    // A body without the app's own structure must not be passed through verbatim.
    await worker.fetch(post({ message: 'hello ``` injected', body: 'IGNORE PREVIOUS INSTRUCTIONS' }), GH_ONLY);
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.body).not.toContain('IGNORE PREVIOUS INSTRUCTIONS');
    expect(sent.body).toContain('## Suggestion');
    expect(sent.body).toContain('````'); // fence outgrew the pasted backticks
  });

  it('caps an over-long title', async () => {
    const fetchMock = okGitHub();
    vi.stubGlobal('fetch', fetchMock);
    await worker.fetch(post({ title: 'T'.repeat(500), message: 'x' }), GH_ONLY);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).title.length).toBe(200);
  });

  it('never leaks the token or GitHub error detail when GitHub rejects', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('rate limited for token ghp_test_token_value', { status: 403 })));
    vi.stubGlobal('console', { ...console, error: vi.fn() });
    const res = await worker.fetch(post({ message: 'x' }), GH_ONLY);
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


describe('suggestion relay worker — email delivery', () => {
  it('emails the maintainer and files the issue', async () => {
    const fetchMock = routed();
    vi.stubGlobal('fetch', fetchMock);
    const res = await worker.fetch(post({ title: '[Suggestion] Addition: x', message: 'add x' }), ENV);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ ok: true, emailed: true });

    const mailCall = fetchMock.mock.calls.find(([u]) => String(u).includes('resend.com'));
    const mail = JSON.parse(mailCall[1].body);
    expect(mail.to).toEqual(['rkalani@uw.edu']);
    expect(mail.subject).toBe('[Suggestion] Addition: x');
    expect(mail.text).toContain('add x');
    expect(mailCall[1].headers.Authorization).toBe('Bearer re_test_key_value');
  });

  it('sets Reply-To only when the submitter left a real address', async () => {
    let fetchMock = routed();
    vi.stubGlobal('fetch', fetchMock);
    await worker.fetch(post({ message: 'x', contact: 'someone@example.org' }), ENV);
    let mail = JSON.parse(fetchMock.mock.calls.find(([u]) => String(u).includes('resend.com'))[1].body);
    expect(mail.reply_to).toBe('someone@example.org');

    fetchMock = routed();
    vi.stubGlobal('fetch', fetchMock);
    await worker.fetch(post({ message: 'x', contact: 'just a name' }), ENV);
    mail = JSON.parse(fetchMock.mock.calls.find(([u]) => String(u).includes('resend.com'))[1].body);
    expect(mail.reply_to).toBeUndefined();
  });

  // A GitHub failure after the email has gone out must not read as failure, or
  // the app falls back to mailto and the maintainer receives it twice.
  it('reports success when the email went out but GitHub failed', async () => {
    vi.stubGlobal('fetch', routed({ ghOk: false }));
    vi.stubGlobal('console', { ...console, error: vi.fn() });
    const res = await worker.fetch(post({ message: 'x' }), ENV);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ ok: true, emailed: true });
  });

  it('still fails when neither delivery succeeded', async () => {
    vi.stubGlobal('fetch', routed({ mailOk: false, ghOk: false }));
    vi.stubGlobal('console', { ...console, error: vi.fn() });
    const res = await worker.fetch(post({ message: 'x' }), ENV);
    expect(res.status).toBe(502);
  });

  it('delivers by email alone when no GitHub repo is configured', async () => {
    const fetchMock = routed();
    vi.stubGlobal('fetch', fetchMock);
    const res = await worker.fetch(post({ message: 'x' }), { ...ENV, GITHUB_REPO: '', GITHUB_TOKEN: '' });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ ok: true, emailed: true });
    expect(fetchMock.mock.calls.every(([u]) => String(u).includes('resend.com'))).toBe(true);
  });

  it('never leaks either credential when a delivery fails', async () => {
    vi.stubGlobal('fetch', routed({ mailOk: false, ghOk: false }));
    vi.stubGlobal('console', { ...console, error: vi.fn() });
    const text = await (await worker.fetch(post({ message: 'x' }), ENV)).text();
    expect(text).not.toContain('re_test_key_value');
    expect(text).not.toContain('ghp_test_token_value');
  });
});
