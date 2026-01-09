# Evvl - AI Output Evaluation

A Next.js application for comparing and evaluating AI model outputs side by side. Available as both a **web app** and **desktop app**.

## Features

- 🤖 Compare outputs from multiple AI providers:
  - **OpenAI** (GPT-4, GPT-3.5, DALL-E)
  - **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
  - **OpenRouter** (100+ models including DeepSeek, Llama, Mixtral)
  - **Google** (Gemini Pro, Gemini Pro Vision with image generation)
- 🖼️ **Image Generation** support (DALL-E, Gemini)
- ⭐ Rate outputs with 5-star rating system and notes
- 📊 Evaluation history with export to JSON/CSV
- 🔒 **Privacy-first**: API keys stored locally, never sent to our servers
- 💻 **Desktop app** option for true local-only operation
- 📦 No database required - fully client-side storage

## Quick Start (Web App)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3333](http://localhost:3333) in your browser.

### 3. Configure API Keys

1. Click **Settings** in the navigation
2. Enter your API keys:
   - **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **Anthropic**: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   - **OpenRouter**: [openrouter.ai/keys](https://openrouter.ai/keys)
   - **Google Gemini**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
3. Click "Save Keys"

### 4. Create an Evaluation

1. Enter a prompt in the text area
2. Click "Add Column" to select AI models
3. Choose text generation or image generation models
4. Click "Save and Refresh" to generate outputs
5. Rate each output and add notes
6. Results are auto-saved to localStorage

## Desktop App Setup

The desktop version makes **direct API calls** from your machine, ensuring API keys never leave your device.

### Prerequisites

**1. Install Rust** (required for Tauri):

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows:**
Download from [rustup.rs](https://rustup.rs/)

**2. Platform-Specific Dependencies:**

**macOS:**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget \
  file libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

**Windows:**
- Microsoft Visual Studio C++ Build Tools
- WebView2 (pre-installed on Windows 10+)

### Running the Desktop App

**Development mode:**
```bash
npm run tauri:dev
```

This opens the desktop app window with hot-reload enabled.

**Production build:**
```bash
npm run tauri:build
```

Output location: `src-tauri/target/release/bundle/`
- **macOS**: `.app` and `.dmg` in `macos/`
- **Windows**: `.exe` and `.msi` in `msi/`
- **Linux**: `.deb` and `.AppImage` in `deb/` and `appimage/`

## Architecture

### Web App vs Desktop App

**Web App (Vercel):**
```
Browser → Next.js API Routes → AI Providers
```
- API calls proxied through Next.js routes
- Runs on Vercel serverless functions
- CORS handled by proxy

**Desktop App (Tauri):**
```
Desktop Window → Direct HTTPS → AI Providers
```
- Direct API calls from desktop app
- No server dependency
- Complete offline operation (after download)

### How It Works

The app automatically detects the environment:

```typescript
// lib/environment.ts
if (window.__TAURI__) {
  // Desktop: Make direct API calls
  return directApi.generateText(request);
} else {
  // Web: Use Next.js proxy routes
  return proxyApi.generateText(request);
}
```

Both versions share 100% of the UI code - only the API routing differs.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Desktop**: Tauri 2.0 (Rust + WebView)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI SDKs**:
  - OpenAI SDK
  - Anthropic SDK (via fetch)
  - OpenRouter (OpenAI-compatible)
  - Google Generative AI SDK
- **Storage**: Browser localStorage
- **Analytics**: Vercel Speed Insights

## Scripts Reference

```bash
# Web development
npm run dev              # Start Next.js dev server (port 3333)
npm run build            # Build for Vercel deployment
npm run start            # Start production server

# Desktop development
npm run tauri:dev        # Run desktop app in dev mode
npm run tauri:build      # Build desktop app for production
npm run build:tauri      # Build Next.js static export for Tauri

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Other
npm run lint             # Run ESLint
npm run fetch-models     # Update OpenRouter model list
```

## Deploy on Vercel

**Option 1: CLI**
```bash
npm run build
vercel
```

**Option 2: Git Integration**

Connect your GitHub repository to Vercel for automatic deployments on push to main.

## Privacy & Security

### Web App
- ✅ API keys stored in browser localStorage only
- ✅ Keys redacted from Vercel server logs
- ✅ Proxy routes prevent CORS issues
- ✅ No user accounts or authentication required
- ✅ All evaluation data stored locally

### Desktop App
- ✅ API keys stored in localStorage, never transmitted
- ✅ Direct HTTPS connections to AI providers only
- ✅ HTTP scope restricted to trusted domains
- ✅ No telemetry or data collection
- ✅ Complete offline operation
- ✅ Zero server dependency

## Supported Models

### OpenAI
**Text:**
- gpt-4-turbo
- gpt-4
- gpt-3.5-turbo

**Image:**
- dall-e-3
- dall-e-2

### Anthropic
- claude-3-5-sonnet-20241022
- claude-3-opus-20240229
- claude-3-haiku-20240307

### OpenRouter
100+ models including:
- deepseek/deepseek-chat
- meta-llama/llama-3.1-70b-instruct
- mistralai/mixtral-8x7b-instruct
- And many more...

### Google Gemini
**Text:**
- gemini-1.5-pro
- gemini-1.5-flash

**Image:**
- gemini-2.0-flash-exp (image generation preview)

## File Structure

```
evvl/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/
│   ├── api/            # API client abstraction
│   │   ├── client.ts   # Environment-aware routing
│   │   ├── direct.ts   # Direct API calls (desktop)
│   │   └── proxy.ts    # Proxy calls (web)
│   ├── providers/      # AI provider integrations
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── openrouter.ts
│   │   └── gemini.ts
│   ├── environment.ts  # Runtime detection
│   └── storage.ts      # localStorage helpers
├── src-tauri/          # Tauri desktop app
│   ├── src/main.rs     # Rust entry point
│   ├── tauri.conf.json # Tauri configuration
│   └── capabilities/   # Security permissions
└── public/             # Static assets
```

## Development

### Adding a New Provider

1. Create provider module in `lib/providers/your-provider.ts`
2. Implement `generateText()` and/or `generateImage()` functions
3. Export from `lib/providers/index.ts`
4. Add to `lib/api/direct.ts` for desktop support
5. Add API route in `app/api/generate/route.ts` for web support
6. Update `lib/config.ts` with provider configuration

### Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

Tests use Jest + React Testing Library. All components and API routes have test coverage.

## Troubleshooting

### Web App

**Port 3333 in use:**
```bash
lsof -ti:3333 | xargs kill -9
npm run dev
```

**API calls failing:**
1. Check API keys in Settings
2. Verify keys are valid on provider websites
3. Check browser console for errors

### Desktop App

**"Rust not found" error:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Build errors:**
```bash
rustup update
rm -rf src-tauri/target
npm run tauri:build
```

**Port conflicts:**
```bash
lsof -ti:3333 | xargs kill -9
npm run tauri:dev
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT

## Documentation

- **Tauri Setup Guide**: [`TAURI_SETUP.md`](TAURI_SETUP.md) - Complete desktop app documentation
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Tauri Docs**: [tauri.app](https://tauri.app)

## Links

- **Web App**: [app.evvl.com](https://app.evvl.com)
- **Marketing Site**: [evvl.com](https://evvl.com)
- **GitHub**: [github.com/yourusername/evvl](https://github.com/yourusername/evvl)
- **Issues**: [github.com/yourusername/evvl/issues](https://github.com/yourusername/evvl/issues)
