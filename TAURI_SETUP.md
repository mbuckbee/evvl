# Evvl Desktop App (Tauri)

Evvl is available as both a web app and a desktop application. The desktop version offers enhanced privacy by making direct API calls to AI providers from your machine, ensuring your API keys never leave your device.

## Architecture

- **Web App (app.evvl.com)**: Routes API calls through Next.js API routes on Vercel
- **Desktop App (Tauri)**: Makes direct API calls to OpenAI, Anthropic, OpenRouter, and Google from your machine

Both versions share the same UI and functionality. The API client automatically detects whether it's running in Tauri and routes requests accordingly.

## Prerequisites

### 1. Install Rust

Tauri requires Rust to build the desktop application. Install it from [rustup.rs](https://rustup.rs/):

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows:**
Download and run the installer from [rustup.rs](https://rustup.rs/)

After installation, verify:
```bash
rustc --version
cargo --version
```

### 2. Platform-Specific Dependencies

**macOS:**
- Xcode Command Line Tools (usually already installed)
```bash
xcode-select --install
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

**Windows:**
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10+)

## Development

### Running the Desktop App in Development Mode

1. Start the development server:
```bash
npm run tauri:dev
```

This will:
- Start the Next.js dev server on port 3333
- Launch the Tauri desktop window
- Enable hot-reload for both frontend and Rust code

### Building for Production

Build the desktop app for your current platform:

```bash
npm run tauri:build
```

The built application will be in `src-tauri/target/release/bundle/`:
- **macOS**: `.app` and `.dmg` in `macos/`
- **Windows**: `.exe` and `.msi` in `msi/`
- **Linux**: `.deb`, `.AppImage` in `deb/` and `appimage/`

## How It Works

### Environment Detection

The app automatically detects if it's running in Tauri using `window.__TAURI__`:

```typescript
// lib/environment.ts
export function getRuntimeEnvironment(): RuntimeEnvironment {
  if (typeof window !== 'undefined' && typeof (window as any).__TAURI__ !== 'undefined') {
    return 'tauri';
  }
  return 'web';
}
```

### API Routing

The API client routes requests based on the environment:

```typescript
// lib/api/client.ts
async generateText(request: GenerateTextRequest) {
  if (this.environment === 'tauri') {
    return directApi.generateText(request);  // Direct API call
  } else {
    return proxyApi.generateText(request);   // Proxy through /api/generate
  }
}
```

### Direct API Calls (Desktop)

In the desktop app:
- `lib/api/direct.ts` makes direct HTTPS calls to AI providers
- `lib/providers/*.ts` contain the actual provider integrations
- API keys are stored in localStorage and never sent to any server
- HTTP requests are scoped to trusted domains in `src-tauri/capabilities/http-client.json`

### Proxy API Calls (Web)

In the web app:
- `lib/api/proxy.ts` calls Next.js API routes (`/api/generate`, `/api/generate-image`)
- API routes in `app/api/generate/` use the same provider modules
- API keys are redacted from Vercel logs for security

## Configuration

### Tauri Configuration

Main configuration file: `src-tauri/tauri.conf.json`

Key settings:
- **Window size**: 1400x900 (min: 1000x700)
- **Allowed HTTP domains**: OpenAI, Anthropic, OpenRouter, Google
- **Bundle identifier**: `com.evvl.app`

### Next.js Static Export

For desktop builds, Next.js is configured to output static files:

```javascript
// next.config.mjs
if (process.env.BUILD_MODE === 'tauri') {
  nextConfig.output = 'export';
  nextConfig.images = { unoptimized: true };
  nextConfig.trailingSlash = true;
}
```

## Security

### Desktop App
- ✅ API keys stored locally in localStorage
- ✅ Keys never transmitted to any server
- ✅ Direct HTTPS connections to AI providers
- ✅ HTTP scope restricted to trusted domains
- ✅ No data collection or analytics

### Web App
- ✅ Proxy pattern prevents CORS issues
- ✅ API keys redacted from server logs
- ✅ Same localStorage approach for API keys

## Distribution

### Auto-Updates (Future Enhancement)

The app is configured to support auto-updates via Tauri's updater plugin:

1. Generate update artifacts during build
2. Upload to GitHub Releases
3. App checks for updates on launch
4. Users approve and install updates

This requires:
- Code signing certificates
- Update manifest JSON
- GitHub Actions workflow

See [Tauri Updater Documentation](https://v2.tauri.app/plugin/updater/)

## Troubleshooting

### "Rust not found" error
Install Rust from [rustup.rs](https://rustup.rs/) and restart your terminal.

### "WebView2 not found" (Windows)
Download WebView2 Runtime from [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### Port 3333 already in use
Change the port in `package.json` and `src-tauri/tauri.conf.json`

### Build failures
1. Update Rust: `rustup update`
2. Clean build: `rm -rf src-tauri/target && npm run tauri:build`
3. Check platform-specific dependencies above

## Scripts Reference

- `npm run dev` - Start Next.js dev server (web only)
- `npm run build` - Build for web deployment (Vercel)
- `npm run build:tauri` - Build Next.js static export for Tauri
- `npm run tauri:dev` - Run desktop app in development
- `npm run tauri:build` - Build desktop app for production
- `npm test` - Run tests

## Files Structure

```
evvl/
├── lib/
│   ├── api/
│   │   ├── client.ts        # Main API client with routing
│   │   ├── direct.ts        # Direct API implementation (desktop)
│   │   ├── proxy.ts         # Proxy API implementation (web)
│   │   └── types.ts         # Shared TypeScript interfaces
│   ├── providers/           # Provider integrations (shared)
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── openrouter.ts
│   │   └── gemini.ts
│   └── environment.ts       # Runtime detection
├── src-tauri/
│   ├── tauri.conf.json      # Tauri configuration
│   ├── Cargo.toml           # Rust dependencies
│   ├── capabilities/        # Security capabilities
│   │   └── http-client.json # HTTP allowlist
│   └── src/
│       └── main.rs          # Rust entry point
└── next.config.mjs          # Next.js with conditional static export
```

## Next Steps

1. **Install Rust** (if not already installed)
2. **Run `npm run tauri:dev`** to test the desktop app
3. **Build for production** with `npm run tauri:build`
4. **Distribute** the built app to users

The desktop and web versions will coexist - users can choose their preferred platform!
