# Dashboard viewers

The shared dashboard toolbar renders MUI AvatarGroup. Home does not display or track viewers. Each actual dashboard navigation joins `dashboard-viewers:<tool key>` via the existing authenticated Supabase client. Home, Settings, logout and page exit leave the channel. Presence is ephemeral; it does not query or change database records. An open dashboard tab counts as viewing, even when the tab is in the background. Tabs of the same account in the same dashboard count once.

Only ID, display name, avatar and update time are sent. The feature uses standard public Supabase Presence channels; channel names are not access controls. Presence is a display feature, never an authorization source. If the project disables public channels, configure authenticated private-channel policies before changing the channel to private. Connection errors show an unavailable label and clear stale avatars.

Stable ordering is by user ID. Up to five people are shown; above five, four people plus the exact remaining count are displayed. MUI handles failed images using explicit initials children. The row keeps MUI's reversed DOM, resets the first visual avatar's logical margin and assigns every avatar a z-index. Rings follow the toolbar's `--white` surface token in both themes.

Build and verify from this directory:

```sh
npm ci
npm run build
npm test
```

Commit the generated `assets/dashboard-presence.js` together with `dashboard.html`; no runtime CDN is needed for React/MUI. Browser tests require installed Chrome. Tests use a simulated Presence channel, cover counts 0/1/5/8, duplicate accounts, broken images, overlap geometry, layering, actual toolbar layout at 360/1280px, light/dark rings, stale navigation callbacks, disconnect/reconnect and cleanup. Live multi-account Supabase verification remains a deployment check.
