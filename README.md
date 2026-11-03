# EX-02 Lumina

Inspect HTTP traffic in a lightweight Chrome DevTools panel.

EX-02 Lumina is a Manifest V3 extension that captures completed HTTP and HTTPS requests from the tab being inspected. It shows request and response details, filters traffic, and generates code to replay a request. The extension runs entirely in DevTools; it has no backend, content script, background worker, or host permissions.

## Get started

You'll need Chrome, Node.js 24, and [pnpm](https://pnpm.io/installation) 11.25.0.

```bash
pnpm install
pnpm build
```

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose this project's `dist` directory.
3. Open DevTools on the tab you want to inspect and select **EX-02 Lumina**.
4. Reload the tab to capture requests made during page startup.

After changing the extension code, run `pnpm build` and reload the extension in `chrome://extensions`.

## Use the panel

- Browse the latest 500 captured requests by method, path, status, and duration. Select a row to see its URL, query parameters, headers, and available request and response bodies.
- Search by method or URL. Filter by method or **Errors**, and use the status filter for a code such as `404`, a class such as `4xx`, or `error`.
- Pause or resume capture. **Clear** removes the current list and resumes capture.
- Open **Code** in a request's details to copy a cURL, JavaScript Fetch, Axios, Python Requests, or Java HttpClient example.
- Use **Save summary locally** in the filter menu to store a snapshot in the extension's IndexedDB. **View saved summaries** lets you inspect or delete snapshots and choose to keep the latest 10, 20, or 50; older snapshots are removed when you save or lower the limit.

> [!CAUTION]
> Request details and generated code can include credentials or tokens from captured traffic. Review copied content before sharing it.

## Data and capture limits

Requests stay in memory until cleared, displaced by newer requests, or the panel closes. Response bodies are loaded only when you open the **Response** tab; switching requests releases the previous body. Text previews are limited to one million characters. Chrome may omit response bodies, and binary or Base64 responses have no text preview.

Saving a summary is optional. Each saved entry contains the timestamp, method, origin, status, and duration. Paths, query parameters, headers, and bodies are not saved. Summaries remain in IndexedDB until you delete them or the configured retention limit removes the oldest ones.

Chrome may miss traffic that occurred before DevTools opened. Reload the inspected tab if the list is empty.

## Develop

```bash
pnpm dev           # Local UI preview
pnpm test          # Vitest
pnpm lint          # ESLint
pnpm format:check  # Prettier
pnpm build         # Type-check and package the extension
```

For sample requests in the local UI preview, open `/src/panel/panel.html?demo=1` on the Vite server. Live capture requires the installed DevTools extension.

The interface uses Preact, Preact Signals, Tailwind CSS, and Lucide icons. Vite builds the DevTools page and panel; Dexie provides the optional local summary store.
