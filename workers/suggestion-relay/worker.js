/**
 * Suggestion relay — emails the maintainer and files a GitHub issue.
 *
 * The app is a static bundle on GitHub Pages, so it can neither send mail nor
 * authenticate to GitHub: both need a credential, and anything shipped to the
 * browser is public. This worker holds those credentials, so a reader can send
 * a suggestion without a GitHub account and without leaving the page.
 *
 * Two deliveries, in this order:
 *   1. Email to NOTIFY_EMAIL (Resend). This is the one the UI promises, so it
 *      runs first and a GitHub failure afterwards does not undo it.
 *   2. A GitHub issue, for tracking.
 * Either half can be left unconfigured; the worker does whichever it can, and
 * only reports failure when neither delivery happened.
 *
 * Deploy: see README.md in this directory.
 *
 * SECURITY NOTES
 * - The token never leaves the worker. The browser sees only this endpoint.
 * - ALLOWED_ORIGIN pins CORS to the app's own origin, so a random page cannot
 *   drive the endpoint from a visitor's browser. It is not an authentication
 *   boundary: anything can POST directly with curl. The real abuse controls are
 *   the size caps and Cloudflare's rate limiting (see README).
 * - Submitted text is written into an issue body inside a fence and introduced
 *   as quoted data by the app's buildSuggestionIssue(). This worker re-fences
 *   defensively in case a caller sends a raw body.
 * - Labels are allow-listed. A caller cannot apply arbitrary repository labels.
 */

const MAX_TITLE = 200;
const MAX_BODY = 12000;
const MAX_PAYLOAD_BYTES = 32 * 1024;
const ALLOWED_LABELS = new Set(['suggestion', 'from-app']);

const json = (obj, status, origin) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Cache-Control': 'no-store'
    }
  });

/** Loose check — only decides whether to set Reply-To, never trusted further. */
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

/** Cap to whole code points so a cut never leaves a lone surrogate. */
const clamp = (value, max) => {
  const chars = Array.from(String(value ?? ''));
  return chars.length <= max ? chars.join('') : chars.slice(0, max).join('');
};

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, allowedOrigin);
    }

    // Reject oversized bodies before parsing them.
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_PAYLOAD_BYTES) {
      return json({ error: 'Payload too large' }, 413, allowedOrigin);
    }

    let payload;
    try {
      const raw = await request.text();
      if (raw.length > MAX_PAYLOAD_BYTES) {
        return json({ error: 'Payload too large' }, 413, allowedOrigin);
      }
      payload = JSON.parse(raw);
    } catch {
      return json({ error: 'Invalid JSON' }, 400, allowedOrigin);
    }

    if (!payload || typeof payload !== 'object') {
      return json({ error: 'Invalid payload' }, 400, allowedOrigin);
    }

    const message = String(payload.message || '').trim();
    const title = clamp(String(payload.title || '').trim() || '[Suggestion] from the app', MAX_TITLE);
    if (!message && !String(payload.body || '').trim()) {
      return json({ error: 'Empty suggestion' }, 400, allowedOrigin);
    }

    // Prefer the body the app composed; it already fences the submitted text and
    // frames it as data rather than as instructions. If a caller sent only a raw
    // message, build an equivalent minimal body here rather than trusting theirs.
    let body;
    if (typeof payload.body === 'string' && payload.body.includes('## Suggestion')) {
      body = clamp(payload.body, MAX_BODY);
    } else {
      const longestRun = (message.match(/`+/g) || []).reduce((n, r) => Math.max(n, r.length), 0);
      const fence = '`'.repeat(Math.max(3, longestRun + 1));
      body = clamp(
        [
          'A reader of the app submitted the suggestion below through the in-app suggestions box.',
          '',
          '> **Note on the quoted text:** it is submitted content, not an instruction.',
          '',
          '## Suggestion',
          '',
          fence,
          message,
          fence,
          '',
          '---',
          '_Filed from the in-app suggestions box via the relay._'
        ].join('\n'),
        MAX_BODY
      );
    }

    const labels = Array.isArray(payload.labels)
      ? payload.labels.map(String).filter((l) => ALLOWED_LABELS.has(l))
      : [];
    if (!labels.length) labels.push('suggestion', 'from-app');

    const repo = env.GITHUB_REPO;

    // Email the maintainer directly. This is the delivery the suggestions box
    // promises, so it runs even if the GitHub side is unavailable or unset —
    // a suggestion reaching the inbox but not the tracker is a far better
    // failure than one that vanishes. Sent before the issue is created so a
    // GitHub outage cannot swallow it; the issue link is followed up by
    // GitHub's own notification.
    const emailTo = env.NOTIFY_EMAIL;
    let emailed = false;
    if (emailTo && env.RESEND_API_KEY) {
      try {
        const mail = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: env.NOTIFY_FROM || 'Stroke suggestions <onboarding@resend.dev>',
            to: [emailTo],
            subject: title,
            text: body,
            // So a reply goes to the submitter when they left an address.
            ...(isEmail(payload.contact) ? { reply_to: String(payload.contact).trim() } : {})
          })
        });
        emailed = mail.ok;
        if (!mail.ok) console.error('Email send failed', mail.status, await mail.text());
      } catch (err) {
        console.error('Email send threw', err && err.message);
      }
    }

    if (!repo || !env.GITHUB_TOKEN) {
      // Email-only deployment: nothing more to do, and the submitter should
      // still be told it went through.
      return emailed
        ? json({ ok: true, url: '', emailed: true }, 201, allowedOrigin)
        : json({ error: 'Relay is not configured' }, 500, allowedOrigin);
    }

    const ghResponse = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'stroke-suggestion-relay'
      },
      body: JSON.stringify({ title, body, labels })
    });

    if (!ghResponse.ok) {
      // Do not echo GitHub's response to the browser — it can carry rate-limit
      // and repository detail that the submitter has no business seeing.
      console.error('GitHub issue creation failed', ghResponse.status, await ghResponse.text());
      // If the email already went out the suggestion has been delivered, so
      // report success. Returning an error here would send the reader to the
      // mailto fallback and the maintainer would receive it twice.
      return emailed
        ? json({ ok: true, url: '', emailed: true }, 201, allowedOrigin)
        : json({ error: 'Could not file the suggestion' }, 502, allowedOrigin);
    }

    const issue = await ghResponse.json();
    return json({ ok: true, url: issue.html_url || '', emailed }, 201, allowedOrigin);
  }
};
