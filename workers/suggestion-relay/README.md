# Suggestion relay

Lets anyone send a suggestion from the app's suggestions box **without a GitHub
account**. The relay holds a repository token and opens the issue on the
submitter's behalf.

Until this is deployed and its URL is configured, the suggestions box falls back
to opening a prefilled GitHub issue form, which does require the submitter to
have a GitHub account. Deploying it is what removes that requirement.

## Why a relay is required

The app is a static bundle on GitHub Pages. Creating an issue through GitHub's
API requires a credential, and a static page has nowhere to keep one — shipping
a token in `app.js` would publish it to every visitor. So the token has to live
somewhere the browser cannot read. That is all this worker is.

## How you get notified

You don't need a mail service. The issue is created in your own repository, and
GitHub emails you about new issues through your normal notification settings.
Check <https://github.com/settings/notifications> and confirm you are watching
`rkalani1/stroke` (**Watch → All Activity**, or at least Issues). The submitter's
name/handle/email, if they gave one, is in the issue's Context table under
"Contact", so you can reply directly.

## Deploy

Free tier is enough — the worker only runs when someone sends a suggestion.

1. **Create a token.** GitHub → Settings → Developer settings → **Fine-grained
   personal access tokens** → Generate new token.
   - Repository access: **Only select repositories** → `rkalani1/stroke`
   - Repository permissions: **Issues → Read and write** (nothing else)
   - Set an expiry you will actually renew; the relay fails closed when it lapses
     and the app falls back to the GitHub link.

2. **Deploy the worker.**
   ```bash
   cd workers/suggestion-relay
   npx wrangler login
   npx wrangler secret put GITHUB_TOKEN   # paste the token when prompted
   npx wrangler deploy
   ```
   `wrangler deploy` prints the URL, e.g.
   `https://stroke-suggestion-relay.<your-subdomain>.workers.dev`.

3. **Point the app at it.** Set `suggestionRelayUrl` in `config.example.json`
   (served as the app's runtime config) to that URL and commit:
   ```json
   { "suggestionRelayUrl": "https://stroke-suggestion-relay.<your-subdomain>.workers.dev" }
   ```
   Only `https:` URLs are accepted; anything else is ignored and the box stays on
   the fallback. No rebuild of `app.js` is needed — the config is fetched at
   runtime.

4. **Check it.** Open the app, send a test suggestion, confirm the issue appears
   in the repository and that the email reaches you.

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
and falls back to the prefilled GitHub link automatically, so the suggestions box
keeps working.

## A note on what arrives

Issues land in a **public** repository, so submitted text is world-readable. The
suggestions box asks submitters to leave out patient details, but that is a
request, not an enforcement. If you would rather suggestions were not public,
point `GITHUB_REPO` at a private repository instead — the worker needs no other
change, and the token's repository access should then be scoped to that repo.
