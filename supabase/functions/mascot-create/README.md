# Cancelled — 2026-09-28

The site owner cancelled user-created mascots. PR #28 is closed without merging; the production frontend keeps its built-in mascots. The deployed mascot-create endpoint now returns HTTP 410 and makes no OpenAI or database calls. No API key is needed. Private tables and the bucket are retained unused; no user data was deleted. The setup notes below describe the abandoned implementation, not current activation instructions.

# User mascot rollout

Settings → Companion includes the studio. Built-in mascots remain available without the backend. No API key belongs in the static site.

## Deployment status — 2026-09-28

- Migration applied successfully through the Supabase SQL editor to `ytbcydursrpjqnaalhxc`. Do not run the initial creation migration again on this project; it is not idempotent and was applied outside CLI migration history.
- `mascot-create` deployed through the dashboard editor with source matching this repository. Legacy gateway JWT verification is off; the function requires an authenticated user via `auth.getUser`.
- Live checks: CORS preflight returns 200 for `https://teamqamcvn.com`; unauthenticated POST returns 401.
- No custom secrets existed at the last check. Still pending: add `OPENAI_API_KEY`, verify a real permitted-user generation, and publish the frontend. No paid image request has run.
- Frontend changes are saved in draft PR https://github.com/tqamcvn/MCVN/pull/28 and are not on the production website yet.

## Setup for a fresh environment

1. Apply `supabase/migrations/202609280001_user_mascots.sql` to project `ytbcydursrpjqnaalhxc` via the SQL editor or migration workflow. This adds private storage, owner-only policies, account preferences and atomic quotas.
2. In Supabase → Edge Functions → Secrets, set `OPENAI_API_KEY` to a project key with image generation access. Never paste it into the repository, frontend or chat. Optional `MASCOT_IMAGE_MODEL` defaults to `gpt-image-1.5`; overrides must support PNG transparency and 1024×1536. `MASCOT_ORIGIN` defaults to `https://teamqamcvn.com`.
3. Deploy: `supabase functions deploy mascot-create --project-ref ytbcydursrpjqnaalhxc --no-verify-jwt`. The handler validates bearer tokens via `auth.getUser` before any privileged action. Supabase injects its URL and service role secret.
4. Validate with a real permitted account and API key before publishing: text generation, reference photo, quota, provider failure, cross-account access denial, save selection and reload. The API aborts after 110 seconds to stay within the Edge request limit. Timeouts may still incur provider charges.
5. Publish `dashboard.html` and the changed `lantern-companion` files via the repository's GitHub Pages workflow.

## Behavior and limits

- Three attempted creations per rolling 24 hours per user; one active attempt. Failed calls count. Clients cannot alter quota rows. No automatic paid retries.
- Reference photos are sent to OpenAI but not persisted by this app. Generated sheets are private and downloaded only with authentication. No user images or signed URLs are stored in localStorage.
- One 3×6 atlas contains nine directions and nine expressions. Browser code rejects missing, opaque, clipped or severely inconsistent frames, centers each frame and aligns its baseline, then builds two 3×3 sheets. Semantic expression correctness and character identity require user preview. A rejected atlas remains in the library; generating again uses another attempt.
- The latest 30 mascots appear in the library. An older selected mascot loads separately. Blob URLs are cleared on sign-out/account change.
- Custom mascots apply to the dashboard and embedded tools that share the parent's companion. Standalone tools retain built-in mascots until account loading is integrated there.
- Studio copy is currently Vietnamese; existing language switching remains intact.
- Production migration, provider output and deployed Edge behavior require credentialed integration validation. Mock tests are not deployment evidence.

References: [Images API](https://developers.openai.com/api/docs/guides/image-generation), [Edge limits](https://supabase.com/docs/guides/functions/limits).

