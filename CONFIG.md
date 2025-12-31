# Configuration Guide

Evvl uses a centralized configuration file to manage AI providers and their available models.

## Configuration File

All provider and model configuration is located in **`lib/config.ts`**.

## Adding or Modifying Models

To add a new model or update existing models, edit the `PROVIDERS` array in `lib/config.ts`:

```typescript
{
  key: 'openai',
  name: 'ChatGPT',
  logo: '/logos/chatgpt.svg',
  settingsUrl: 'https://platform.openai.com/api-keys',
  testModel: 'gpt-3.5-turbo',  // Model used for API key testing
  models: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    // Add more models here
  ],
}
```

### Model Properties

- **`value`**: The model identifier used in API calls (e.g., `gpt-4o`, `claude-3-5-sonnet-20241022`)
- **`label`**: The display name shown in the UI (e.g., `GPT-4o`, `Claude 3.5 Sonnet`)

### Provider Properties

- **`key`**: Unique identifier for the provider (`openai`, `anthropic`, `openrouter`)
- **`name`**: Display name shown in the UI
- **`logo`**: Path to the provider's logo (must be in `/public/logos/`)
- **`settingsUrl`**: URL where users can obtain API keys
- **`testModel`**: (Optional) Model to use when testing API keys (defaults to first model if not specified)
- **`models`**: Array of available models for this provider

## Examples

### Adding a New Model to OpenAI

```typescript
{
  key: 'openai',
  name: 'ChatGPT',
  logo: '/logos/chatgpt.svg',
  settingsUrl: 'https://platform.openai.com/api-keys',
  testModel: 'gpt-3.5-turbo',
  models: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-5', label: 'GPT-5' },  // NEW MODEL ADDED
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    // ... other models
  ],
}
```

### Adding a New OpenRouter Model

```typescript
{
  key: 'openrouter',
  name: 'OpenRouter',
  logo: '/logos/openrouter.svg',
  settingsUrl: 'https://openrouter.ai/keys',
  testModel: 'openai/gpt-3.5-turbo',
  models: [
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'mistral/mistral-large', label: 'Mistral Large' },  // NEW MODEL ADDED
    // ... other models
  ],
}
```

### Changing the Default Model

The first model in the `models` array is used as the default. To change it, simply reorder the array:

```typescript
models: [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },  // Now the default
  { value: 'gpt-4o', label: 'GPT-4o' },
  // ... other models
],
```

## Adding a New Provider

To add a completely new AI provider:

1. **Add logo** to `/public/logos/` (e.g., `/public/logos/newprovider.svg`)

2. **Update types** in `lib/types.ts`:
   ```typescript
   export interface ApiKeys {
     openai?: string;
     anthropic?: string;
     openrouter?: string;
     newprovider?: string;  // ADD THIS
   }
   ```

3. **Add provider config** in `lib/config.ts`:
   ```typescript
   export const PROVIDERS: ProviderConfig[] = [
     // ... existing providers
     {
       key: 'newprovider',
       name: 'New Provider',
       logo: '/logos/newprovider.svg',
       settingsUrl: 'https://newprovider.com/api-keys',
       testModel: 'newprovider-model-1',
       models: [
         { value: 'newprovider-model-1', label: 'Model 1' },
         { value: 'newprovider-model-2', label: 'Model 2' },
       ],
     },
   ];
   ```

4. **Update API route** in `app/api/generate/route.ts`:
   ```typescript
   else if (provider === 'newprovider') {
     // Add API call logic for new provider
   }
   ```

5. **Update settings page** in `app/settings/page.tsx`:
   - Add input field for new provider's API key
   - Add link to provider's settings URL

## Helper Functions

The config file exports several helper functions:

- **`getProvider(key)`**: Get full configuration for a specific provider
- **`getProviderKeys()`**: Get array of all provider keys
- **`getModelsForProvider(key)`**: Get all models for a specific provider
- **`getDefaultModel(key)`**: Get the default (first) model for a provider
- **`getTestModel(key)`**: Get the test model for a provider

## No Restart Required

Changes to the configuration file take effect immediately during development (with hot reload). In production, you'll need to rebuild and redeploy the application.

## Best Practices

1. **Keep models in order**: List most capable/recommended models first
2. **Use clear labels**: Model labels should be user-friendly
3. **Test after changes**: Always test that new models work with their respective APIs
4. **Consistent naming**: Use provider's official model identifiers for the `value` field
5. **Update testModel**: If you add a cheaper/faster model, consider using it for testing
