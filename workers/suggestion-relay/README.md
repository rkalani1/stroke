# Suggestion relay

Emails suggestions to the maintainer and files them as GitHub issues, so a
reader can send one **without a GitHub account and without leaving the page**.

Until this is deployed and its URL is configured, the suggestions box falls back
to a `mailto:` link — the suggestion still reaches your inbox, but the reader
needs a working mail client and it does not become an issue. Deploying this
removes both limitations.

## Why a relay is required

The app is a static bundle on GitHub Pages, so it can neither send mail nor
authenticate to GitHub: both need a credential, and anything shipped in `app.js`
is published to every visitor. The credentials have to live somewhere the
browser cannot read. That is all this worker is.

## What it does, in order

1. **Emails `NOTIFY_EMAIL`** (via Resend). This is the delivery the UI promises,
   so it runs first — a GitHub failure afterwards cannot undo it, and the worker
   reports success as long as the email went out.
2. **Files a GitHub issue** for tracking.

Either half can be left unconfigured and the worker does whichever it can. It
only reports failure when neither delivery happened, which is what lets the app
fall back to `mailto:` without the risk of you receiving the same note twice.

If the submitter left an email address in the contact field, it is set as
`Reply-To`, so replying to the notification goes straight back to them.

## Deploy

Free tier is enough — the worker only runs when someone sends a suggestion.

1. **Create a token.** GitHub → Settings → Developer settings → **Fine-grained
   personal access tokens** → Generate new token.
   - Repository access: **Only select repositories** → `rkalani1/stroke`
   - Repository permissions: **Issues → Read and write** (nothing else)
   - Set an expiry you will actually renew; the relay fails closed when it lapses
     and the app falls back to the `mailto:` link.

2. **Get a Resend API key** at <https://resend.com> (free tier is ample).
   The default `NOTIFY_FROM` uses Resend's sandbox sender, which is fine for
   testing; before relying on it, verify a domain in Resend and set
   `NOTIFY_FROM` to an address on it, or university mail filtering may drop the
   messages. Confirm the first one does not land in Junk.

3. **Deploy the worker.**
   ```bash
   cd workers/suggestion-relay
   npx wrangler login
   npx wrangler secret put GITHUB_TOKEN     # paste the token when prompted
   npx wrangler secret put RESEND_API_KEY   # paste the Resend key
   npx wrangler deploy
   ```
   `wrangler deploy` prints the URL, e.g.
   `https://stroke-suggestion-relay.<your-subdomain>.workers.dev`.

4. **Point the app at it.** Set `suggestionRelayUrl` in `config.example.json`
   (served as the app's runtime config) to that URL and commit:
   ```json
   { "suggestionRelayUrl": "https://stroke-suggestion-relay.<your-subdomain>.workers.dev" }
   ```
   Only `https:` URLs are accepted; anything else is ignored and the box stays on
   the fallback. No rebuild of `app.js` is needed — the config is fetched at
   runtime.

5. **Check it.** Open the app, send a test suggestion, and confirm both that the
   email reaches the address you set in NOTIFY_EMAIL and that the issue appears
   in the repository.

## Abuse controls

The endpoint is deliberately unauthenticated — that is the entire point — so
assume anything can POST to it:

- **Size caps** are enforced in the worker (32 KB payload, 200-char title,
  12 000-char body).
- **Labels are allow-listed** to `suggestion` / `from-app`, so a caller cannot
  apply arbitrary repository labels.
- **CORS** is pinned to `ALLOWED_ORIGIN`. This stops other web pages driving the
  endpoint from a visitor's browser. It is *not* an authentication boundary —
  `curl` ignores CORS entirely.
- **Rate limiting is not in the worker code.** Add it in the Cloudflare dashboard
  (Security → WAF → Rate limiting rules) on the worker's route — something like
  5 requests per minute per IP is plenty. Do this before publicising the app
  widely.

If the endpoint is ever abused, delete the worker: the app detects the failure
and falls back to the `mailto:` link automatically, so the suggestions box keeps
working. Note that an unauthenticated endpoint that sends mail is a spam vector
pointed at your inbox, which makes the rate-limiting rule more important here
than it would be for issue creation alone.

## A note on what arrives

Issues land in a **public** repository, so submitted text is world-readable
even though the same text also reaches you privately by email. If you would
rather suggestions were not public, either point `GITHUB_REPO` at a private
repository — the worker needs no other change, with the token's repository
access scoped to match — or clear `GITHUB_REPO` entirely for email-only
delivery.
