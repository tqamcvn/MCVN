# My Space for MCVN

A local creative workspace following the supplied screenshots and feature brief. Reference: [vanductan-NLT/my-space](https://github.com/vanductan-NLT/my-space).

## Local development

Requires Node 22.12+ (Node 24 recommended).

```sh
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. On Windows PowerShell, use `Copy-Item .env.example .env.local`.

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

## Modes

- `/write`: Tiptap, document library, title/body search, autosave, formatting, TXT/Markdown import, HTML/text/JSON export, focus, statistics, browser print/PDF.
- `/create`: official tldraw SDK, local boards, 500 ms debounced snapshots, embedded local raster images, validated JSON import/export, native image/PNG tools.
- `/work`: focus timer adapted from the team's qamcvnfocus app, rewritten without login or Supabase sync: focus/short break/long break/meditation modes, 25/45/60/90-minute presets plus a suggestion from the last 7 days, abandon warning, discipline streak and daily goal, health reminders, opt-in YouTube music, and a background picker (10 preset pictures or an upload resized to 2560px; suggested fit, fill/whole/stretch/tile/custom size, 9-point position, soften). Timer state uses end timestamps, so background tabs stay accurate. Settings and history are stored in localStorage (`my-space:focus-*`).
- `/frame`: local file/drop/paste screenshots, 14 backgrounds, ratios, chrome, padding, roundness, shadow, scale, watermark, PNG download and clipboard copy.
- `/challenge`: daily prompts, completion history, local-calendar streak and progress export.
- `/`: redirect to last visited mode, or Write.

Tiptap and tldraw are dynamically loaded client-only on their routes. Navigation prefetch is disabled.

## Storage and privacy

Dexie database **my-space**, schema version **1**, tables **documents** and **boards**. Future schema changes must add a new `version(...)`; do not rewrite v1. Preferences, last selected IDs and challenge dates use localStorage.

This is a browser-profile library, not an authenticated/cloud account library. People sharing a browser profile share its library. Clearing site data deletes it. Private browsing may be ephemeral. Export backups regularly.

No document/board contents are posted to this deployment, analytics or AI. Work data is also local; its music panel loads youtube-nocookie.com only after the user presses play. The app has no content API or analytics SDK. tldraw UI assets are self-hosted; external URL previews and embeds are disabled, and uploaded raster assets are embedded in snapshots. SDK license behavior applies: trial licenses may contact tldraw for license analytics without canvas contents.

Persistence failures retain current state in memory across mode changes and offer an immediate export button. Closing/reloading without export can lose unsaved content. Multiple editing tabs are not a collaborative editor; use one editing tab per library.

Backups: `{format:"my-space-backup",version:1,documents:[...],boards:[...]}`. Board files: `{format:"my-space-board",version:1,board:{...}}`. Imports validate all content before IndexedDB writes and commit atomically. Imported items receive new IDs, keeping existing and unsaved work. Unknown/damaged files are rejected. Maximum import size: 100 MB.

## MCVN integration

The repository root remains the existing MCVN website. Its My Space menu opens `/my-space/` in the tool frame. The routes above use that prefix in this deployment.

```sh
npm run build:pages
```

This exports Next.js to `out/` and replaces the repository's `my-space/` directory with it. The built `my-space/` folder is committed, because teamqamcvn.com is served by GitHub Pages straight from the `Workspace` branch; no Next.js server or Actions workflow is needed. Rebuild and commit `my-space/` whenever the app changes.

Inside the dashboard, My Space and the MCVN sidebar take turns: opening My Space collapses the MCVN sidebar (restored when you leave, without changing the saved preference), expanding the My Space rail collapses the MCVN sidebar, and expanding the MCVN sidebar collapses the rail. The two frames talk through same-origin `postMessage` (`my-space-rail`, `mcvn-sidebar`). The Back to MCVN link is hidden when embedded.

A separate host can build the `my-space-app` directory with `npm run build`, output `out`, and an empty `NEXT_PUBLIC_BASE_PATH`. The Back to MCVN link assumes MCVN is on the same origin; adjust it for a separate domain.

See `.env.example` for configuration. A tldraw production license is required for production canvas use. Without it, build succeeds but Create displays the missing configuration and the SDK's license notice. See https://tldraw.dev/community/license. This is not a license workaround.

## Limits

No cloud sync, collaboration, AI or Word/Google Docs compatibility. Markdown import preserves safe text instead of reconstructing formatting. PDF uses browser print. Frame accepts local images, not remote URLs. Image clipboard requires browser support and a secure context; PNG download is the fallback. Production canvas testing needs the owner's valid license key.
