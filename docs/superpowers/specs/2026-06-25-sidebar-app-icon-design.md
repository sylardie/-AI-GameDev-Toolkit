# Sidebar Application Icon Design

## Goal

Replace the sidebar's generated blue `AI` badge with the same artwork used by
the packaged Windows application icon.

## Scope

Change only the sidebar brand icon and its directly related styles. Keep the
brand title, subtitle, sidebar dimensions, navigation layout, and packaged
application icon configuration unchanged.

## Design

Copy `frontend/build/icon.ico` to `frontend/public/app-icon.ico` so Vite serves
the asset in development and includes it in production builds.

In `frontend/src/components/Sidebar.jsx`, replace the `AI` text inside
`.brand-icon` with an image:

```jsx
<img src="/app-icon.ico" alt="" />
```

The image is decorative because the adjacent brand title already identifies
the application. The existing `.brand-icon` container remains 44 by 44 pixels
to preserve alignment. Its generated gradient and text styles are removed,
and the image fills the container using `object-fit: contain`.

## Compatibility

The public-root URL works in the Vite development server and in the packaged
frontend resources. The source Windows icon remains the canonical packaging
asset; the copied public file is the web UI representation.

## Verification

- Run the frontend production build.
- Confirm the build output contains `app-icon.ico`.
- Confirm the sidebar no longer renders the `AI` text badge.
- Preserve all unrelated uncommitted frontend work.
