# Feedback

Added to dashboard sidebar using the existing iframe tool navigation.

## Activate
1. Apply `supabase/feedback.sql` once in the existing Supabase project SQL Editor.
2. Publish dashboard.html and the feedback directory through the existing website deployment.
3. Sign in with a real account; confirm create, list, upvote, attachment download and a second account reading the same submission.

Production migration applied successfully to MCVN on 2026-09-21; the two tables and private attachment bucket are now provisioned. IT can update status and refine proposal categories through the trusted Supabase administration interface. End users submit either Lỗi or Đề xuất; historical Cải tiến / Tính năng tags are supported.

Drafts are per account in localStorage, debounced by 2 seconds and flushed on close, pagehide, beforeunload and document hiding. Content remains after a submission failure. Only successful insertion clears the draft. Images must be reselected after reloading; filenames are retained in draft metadata. A stable draft UUID prevents duplicate submissions when retrying a lost response. Storage permission failures show a warning. Abrupt browser/process crashes may lose the final debounce interval.

## Verification
Install Playwright in your development environment, then run `node tests/feedback.cjs` (uses installed Microsoft Edge). The test stubs Supabase; it checks draft debounce/reload/close, character counter, failed and successful submits, filtering, full content details, over-limit validation and mobile overflow. Screenshots are written to the OS temp directory. Real database RLS and storage integration still require the activation smoke test above.



Notifications: apply feedback-management.sql and feedback-notifications.sql after feedback.sql. Notifications are recipient-only, created by database triggers for manager replies/status changes (excluding self-notifications). The sidebar checks unread counts every 30 seconds and after a notification is opened. Completed feedback owners can submit one 1–5 rating with an optional comment. Task statuses are managed through the database-checked RPC.


Mentions: feedback-mentions.sql adds an authenticated directory of active dashboard accounts that have signed in, plus database triggers for @email mentions in feedback and manager replies. Type @ and choose a name/email. Duplicate mentions of one recipient in a message produce one event; self mentions are ignored; the feedback owner already receives the standard reply event. Read notifications remain hidden after refresh.
