# API Request Inspector

API Request Inspector is a Manifest V3 Chrome DevTools extension. It captures completed HTTP and HTTPS requests from the inspected tab and displays request and response details in a panel styled after the supplied reference image.

## Stack

Preact, TypeScript, Vite, Tailwind CSS, Preact Signals, Lucide, and Vitest. Optional local summaries use IndexedDB through Dexie, loaded only when requested. There is no backend, content script, background worker, or host permission.

## Install

1. Install [pnpm](https://pnpm.io/installation) and run `pnpm install`.
2. Run `pnpm build`.
3. Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the generated `dist` folder.
4. Open DevTools on the tab to inspect and select **API Inspector**. Reload the page to capture startup requests.

`pnpm dev` starts a local UI preview. Add `?demo=1` to `/src/panel/panel.html` during development to see sample rows. Demo data is excluded from the production build.

## Features

The panel captures and lists requests with method, endpoint, status, and duration. Select a row for query parameters, request and response headers, bodies, content type, JSON formatting, and copy controls. Search, method tabs, status filters (`404`, `4xx`, or `error`), pause/resume, and clear are available above the list.

The newest 500 requests stay in memory. Response bodies load only when selected; the visible preview is capped at one million characters. Opening another row releases the previous body. The optional local snapshot stores only timestamp, method, origin, status, and timing. It does not store paths, query parameters, headers, or bodies.

Chrome may omit traffic that occurred before DevTools opened. Reload the inspected tab to capture it. Chrome does not always make response bodies available; binary or Base64 responses have no text preview.

## Verify

Run `pnpm test` and `pnpm build`.
