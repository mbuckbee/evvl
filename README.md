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

## Command Line Interface (CLI)

The desktop app includes a CLI for programmatic use from tools like Claude Code, scripts, or CI pipelines. The CLI shares storage with the GUI, so projects and prompts created in the app are available from the command line.

### Installation

After installing the desktop app, add the CLI to your PATH:

**macOS:**
```bash
# The app can install the CLI for you:
evvl --settings  # Opens settings, click "Install CLI"

# Or manually create a symlink:
sudo ln -sf /Applications/Evvl.app/Contents/MacOS/Evvl /usr/local/bin/evvl
```

### Quick Start

```bash
# Run a quick evaluation
evvl "Explain quantum computing"

# Run and open GUI to see results
evvl "Review this code" --open

# Pipe prompt from another command
echo "Summarize this" | evvl

# Output as JSON (default when piped)
evvl "Hello world" --json
```

### Commands

```bash
evvl [OPTIONS] [PROMPT]       # Quick evaluation
evvl run [OPTIONS]            # Run with full options
evvl projects                 # List all projects
evvl prompts list             # List prompts in a project
evvl prompts test <name>      # Test a specific prompt
evvl export [OPTIONS]         # Export results
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--open` | `-o` | Open GUI to show results |
| `--json` | | Output as JSON (default when piped) |
| `--project <name>` | `-p` | Project name or ID |
| `--settings` | | Open settings page |
| `--help` | `-h` | Print help information |
| `--version` | `-v` | Print version |

### Run Command

```bash
evvl run --prompt "Your prompt" --models gpt-4,claude-3-5-sonnet
evvl run -p "My Project" --prompt-name "Summary Prompt"
evvl run -p "My Project" --dataset "Test Cases"  # Batch evaluation
evvl run -p "My Project" --no-dataset            # Skip dataset
```

| Option | Description |
|--------|-------------|
| `--prompt <text>` | Prompt text to evaluate |
| `--prompt-name <name>` | Use a saved prompt from the project |
| `--models <list>` | Comma-separated model list (e.g., `gpt-4,claude-3-5-sonnet`) |
| `--dataset <name>` | Dataset name for batch evaluation |
| `--no-dataset` | Don't use dataset even if project has one |
| `--version-note <note>` | Note for new prompt version |

### Export Command

```bash
evvl export --run <run-id> --format json
evvl export --run <run-id> --format csv
```

### Environment Variables

API keys can be set via environment variables (useful for CI/scripts):

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENROUTER_API_KEY="sk-or-..."
export GOOGLE_API_KEY="..."
```

Environment variables take precedence over keys stored in the app.

### JSON Output

When using `--json` or piping output, results are formatted as:

```json
{
  "id": "run_abc123",
  "timestamp": 1706140800000,
  "prompt": "Explain quantum computing",
  "results": [
    {
      "model": "claude-3-5-sonnet-20241022",
      "provider": "anthropic",
      "content": "Quantum computing is...",
      "tokens": 245,
      "latency": 1234,
      "error": null
    }
  ],
  "status": "completed"
}
```

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

## Releasing Desktop Apps

Desktop app releases are automated via GitHub Actions. When you push a version tag, the workflow builds, signs, notarizes, and publishes installers for all platforms.

### Release Process

**1. Update version numbers:**

Edit both files to match your new version:
- `package.json` → `"version": "X.Y.Z"`
- `src-tauri/tauri.conf.json` → `"version": "X.Y.Z"`

**2. Commit and tag:**

```bash
git add package.json src-tauri/tauri.conf.json
git commit -m "Bump version to X.Y.Z"
git push
git tag vX.Y.Z
git push origin vX.Y.Z
```

**3. Wait for build (~10-15 minutes):**

Monitor progress at: [GitHub Actions](../../actions/workflows/release.yml)

### What Gets Built

| Platform | Installer | Update Package |
|----------|-----------|----------------|
| macOS (M1/M2/M3/M4) | `Evvl_X.Y.Z_macOS_M_Series.dmg` | `.app.tar.gz` + `.sig` |
| macOS (Intel) | `Evvl_X.Y.Z_macOS_Intel.dmg` | `.app.tar.gz` + `.sig` |
| Windows | `Evvl_X.Y.Z_Windows_Setup.exe`, `.msi` | `.nsis.zip` + `.sig` |
| Linux | `Evvl_X.Y.Z_Linux.AppImage`, `.deb` | `.AppImage.tar.gz` + `.sig` |

### Release Repositories

- **Private repo** (`evvl`): Source code and internal releases
- **Public repo** (`evvl-releases`): Public download releases with friendly filenames

---

## Code Signing & Notarization

### macOS Code Signing

All macOS builds are signed with an Apple Developer ID Application certificate and notarized with Apple. This ensures users don't see security warnings when installing.

**Required certificates:**
- Developer ID Application certificate (from Apple Developer Program)
- DeveloperIDG2CA intermediate certificate (installed in Keychain)

**Local development signing:**

Set these environment variables in `~/.zshrc`:

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

Then run `npm run tauri:build` to build, sign, and notarize locally.

### Windows Code Signing

Windows builds are currently unsigned. Users will see SmartScreen warnings on first install, which they can bypass by clicking "More info" → "Run anyway".

For production deployments, consider obtaining an EV (Extended Validation) code signing certificate from providers like DigiCert or Sectigo.

---

## Auto-Updates

Evvl supports automatic updates via Tauri's updater plugin. When a new version is released, users are prompted to update.

### How It Works

1. The app checks `latest.json` from the releases repo on startup
2. If a newer version exists, the user sees an update prompt
3. Updates are signed with Ed25519 keys and verified before installation
4. The app downloads the appropriate update package for the user's platform

### Configuration

**src-tauri/tauri.conf.json:**
```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/mbuckbee/evvl-releases/releases/latest/download/latest.json"
      ],
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6..."
    }
  },
  "bundle": {
    "createUpdaterArtifacts": true
  }
}
```

### latest.json

Each release includes a `latest.json` file for the auto-updater:

```json
{
  "version": "0.1.6",
  "notes": "Evvl v0.1.6 - See release notes...",
  "pub_date": "2026-01-20T12:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "url": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_macOS_M_Series.app.tar.gz",
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6..."
    },
    "darwin-x86_64": {
      "url": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_macOS_Intel.app.tar.gz",
      "signature": "..."
    },
    "windows-x86_64": {
      "url": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_Windows.nsis.zip",
      "signature": "..."
    },
    "linux-x86_64": {
      "url": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_Linux.AppImage.tar.gz",
      "signature": "..."
    }
  }
}
```

---

## downloads.json

Each release includes a `downloads.json` file for the marketing site:

```bash
curl -sL https://github.com/mbuckbee/evvl-releases/releases/latest/download/downloads.json
```

```json
{
  "version": "0.1.6",
  "tag": "v0.1.6",
  "releaseDate": "2026-01-20",
  "downloads": {
    "macos-m-series": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_macOS_M_Series.dmg",
    "macos-intel": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_macOS_Intel.dmg",
    "windows-exe": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_Windows_Setup.exe",
    "windows-msi": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_Windows.msi",
    "linux-appimage": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_Linux.AppImage",
    "linux-deb": "https://github.com/mbuckbee/evvl-releases/releases/download/v0.1.6/Evvl_0.1.6_Linux.deb"
  },
  "filenames": {
    "macos-m-series": "Evvl_0.1.6_macOS_M_Series.dmg",
    "macos-intel": "Evvl_0.1.6_macOS_Intel.dmg",
    "windows-exe": "Evvl_0.1.6_Windows_Setup.exe",
    "windows-msi": "Evvl_0.1.6_Windows.msi",
    "linux-appimage": "Evvl_0.1.6_Linux.AppImage",
    "linux-deb": "Evvl_0.1.6_Linux.deb"
  }
}
```

---

## GitHub Secrets

The release workflow requires these secrets configured in the repository:

### Required Secrets

| Secret | Description |
|--------|-------------|
| `PUBLIC_RELEASE_TOKEN` | GitHub PAT with write access to `evvl-releases` repo |
| `TAURI_SIGNING_PRIVATE_KEY` | Ed25519 private key for signing updates |

### macOS Code Signing Secrets

| Secret | Description |
|--------|-------------|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` certificate file |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting the .p12 |
| `APPLE_SIGNING_IDENTITY` | e.g., `Developer ID Application: Name (TEAM_ID)` |
| `APPLE_ID` | Apple Developer account email |
| `APPLE_PASSWORD` | App-specific password for notarization |
| `APPLE_TEAM_ID` | 10-character team identifier |

### Creating the Certificate Secret

```bash
# Export certificate from Keychain as .p12 file, then:
base64 -i ~/Desktop/certificate.p12 | pbcopy
# Paste into APPLE_CERTIFICATE secret
```

---

## Secrets & Credentials Reference

This section documents ALL secrets, credentials, and sensitive data used by Evvl. **Keep this information secure!**

### Single Source of Truth: tauri-build-info.json

All build credentials are stored in ONE file: `tauri-build-info.json` (gitignored).

```json
{
  "APPLE_SIGNING_IDENTITY": "Developer ID Application: Your Name (TEAMID)",
  "APPLE_ID": "your@email.com",
  "APPLE_PASSWORD": "xxxx-xxxx-xxxx-xxxx",
  "APPLE_TEAM_ID": "YOURTEAMID",
  "TAURI_SIGNING_PRIVATE_KEY": "<base64 private key>",
  "TAURI_SIGNING_PRIVATE_KEY_PASSWORD": "<key password>",
  "TAURI_SIGNING_PUBLIC_KEY": "<base64 public key>"
}
```

### Setup on New Machine

1. Download `tauri-build-info.json` from 1Password ("Evvl Apple Signing" → Documents)
2. Place in project root
3. Run `npm run tauri:build:signed`

### After Credential Changes

1. Update `tauri-build-info.json` locally
2. If public key changed, update `src-tauri/tauri.conf.json` pubkey field
3. Manually re-upload JSON to 1Password

### Critical Files

| File | Location | Purpose | If Lost |
|------|----------|---------|---------|
| `tauri-build-info.json` | Project root (gitignored) | ALL build secrets | Restore from 1Password |
| Apple `.p12` | Keychain / exported file | macOS code signing certificate | Request new from Apple Developer Portal |

**Note:** No separate `.key` files needed. Private/public keys are stored in the JSON.

### GitHub Repository Secrets

Configure these in Settings → Secrets and variables → Actions:

| Secret | Description | How to Obtain |
|--------|-------------|---------------|
| `PUBLIC_RELEASE_TOKEN` | GitHub PAT with write access to `evvl-releases` repo | GitHub → Settings → Developer settings → PATs |
| `TAURI_SIGNING_PRIVATE_KEY` | Value of `TAURI_SIGNING_PRIVATE_KEY` from JSON | Copy from `tauri-build-info.json` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Value of `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` from JSON | Copy from `tauri-build-info.json` |
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` certificate | `base64 -i certificate.p12 \| pbcopy` |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting .p12 | Set during certificate export |
| `APPLE_SIGNING_IDENTITY` | e.g., `Developer ID Application: Name (TEAM_ID)` | Keychain Access → certificate name |
| `APPLE_ID` | Apple Developer account email | Your Apple ID email |
| `APPLE_PASSWORD` | App-specific password for notarization | appleid.apple.com → App-Specific Passwords |
| `APPLE_TEAM_ID` | 10-character team identifier | developer.apple.com → Membership |

### Vercel Environment Variables

Configure in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Required For |
|----------|-------------|--------------|
| `KV_REST_API_URL` | Vercel KV connection URL | Analytics, sharing |
| `KV_REST_API_TOKEN` | Vercel KV auth token | Analytics, sharing |
| `BACKROOM_PASSWORD` | Password for /backroom analytics | Admin access |
| `CRON_SECRET` | Secret for cron job authentication | Daily snapshots |

### Where Credentials Are Used

| Credential | Used In | Purpose |
|------------|---------|---------|
| `tauri-build-info.json` | `npm run tauri:build:signed` | All local build signing (reads JSON, never contacts 1Password) |
| GitHub Secrets | GitHub Actions release workflow | CI/CD builds (same values as JSON, configured separately) |
| Apple `.p12` | Keychain, GitHub Actions | macOS code signing certificate |
| GitHub PAT | GitHub Actions release workflow | Push releases to public `evvl-releases` repo |
| Vercel KV | Web app API routes | Store analytics, shares, daily snapshots |
| Backroom password | `/backroom` routes | Protect analytics dashboard |

### Regenerating Secrets

**Tauri Signing Key** (if lost or compromised):
```bash
# Generate new key with known password
npx tauri signer generate -w evvl-new.key -p "your-password-here"

# Copy key contents to tauri-build-info.json:
# - TAURI_SIGNING_PRIVATE_KEY: contents of evvl-new.key
# - TAURI_SIGNING_PRIVATE_KEY_PASSWORD: the password you used
# - TAURI_SIGNING_PUBLIC_KEY: contents of evvl-new.key.pub

# Update tauri.conf.json pubkey field with new public key
# Update GitHub secrets with new values
# Delete the temporary key files
# Re-upload tauri-build-info.json to 1Password
# ⚠️ Users on old versions must manually download new version
```

**Apple App-Specific Password**:
1. Go to appleid.apple.com
2. Sign in → Security → App-Specific Passwords
3. Generate new password
4. Update `APPLE_PASSWORD` in ~/.zshrc and GitHub secrets

**GitHub PAT**:
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope for `evvl-releases`
3. Update `PUBLIC_RELEASE_TOKEN` in GitHub secrets

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `src-tauri/tauri.conf.json` | Tauri config: version, updater endpoints, signing, bundle settings |
| `src-tauri/Cargo.toml` | Rust dependencies including updater plugin |
| `src-tauri/src/lib.rs` | Tauri plugins registration (updater, dialog, etc.) |
| `.github/workflows/release.yml` | Automated build, sign, and release workflow |
| `scripts/build-tauri.sh` | Build script that excludes server-only routes for static export |

See `.github/workflows/release.yml` for full workflow configuration.

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
