# Evvl - AI Output Evaluation

A minimal Next.js application for comparing and evaluating AI model outputs side by side.

## Features

- Compare outputs from multiple AI models (OpenAI, Anthropic) simultaneously
- Rate and annotate outputs with a 5-star rating system
- Save evaluation history locally (localStorage)
- Export results to JSON or CSV
- No database required - fully client-side storage
- API keys stored securely in browser localStorage

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Configure API Keys

1. Navigate to Settings
2. Enter your API keys:
   - OpenAI: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Anthropic: Get from [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
3. Click "Save Keys"

### 4. Create an Evaluation

1. Go back to the home page
2. Enter a prompt
3. Select one or more AI models to compare
4. Click "Generate Outputs"
5. Rate each output and add notes
6. Save the evaluation

### 5. View History

- Navigate to History to see past evaluations
- Click on any evaluation to view details
- Export to JSON or CSV format

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI SDKs**: Vercel AI SDK with OpenAI and Anthropic providers
- **Storage**: Browser localStorage

## Deploy on Vercel

The easiest way to deploy:

```bash
npm run build
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Privacy & Security

- API keys are stored locally in your browser and never sent to external servers
- Keys are only used for direct API calls to OpenAI and Anthropic
- All evaluation data is stored locally in your browser
- No user accounts or authentication required

## Available Models

### OpenAI
- GPT-4 Turbo
- GPT-4
- GPT-3.5 Turbo

### Anthropic
- Claude 3.5 Sonnet
- Claude 3 Opus
- Claude 3 Haiku
