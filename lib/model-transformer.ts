/**
 * Transforms OpenRouter model slugs to formats expected by direct APIs
 */

// Mapping table for Anthropic models: OpenRouter slug → Direct API slug
// NOTE: Includes ACTIVE and DEPRECATED models (deprecated still work until retirement date)
// RETIRED models are filtered out in fetch-models.ts and won't appear here
const ANTHROPIC_MODEL_MAP: Record<string, string> = {
  // Claude 4.5 series (current generation - Dec 2025)
  // With dashes (our config format)
  'anthropic/claude-opus-4-5': 'claude-opus-4-5-20251101',
  'anthropic/claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
  'anthropic/claude-haiku-4-5': 'claude-haiku-4-5-20251001',
  // With dots (OpenRouter format)
  'anthropic/claude-opus-4.5': 'claude-opus-4-5-20251101',
  'anthropic/claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
  'anthropic/claude-haiku-4.5': 'claude-haiku-4-5-20251001',

  // Already-dated Claude 4.5 models (if OpenRouter returns these)
  'anthropic/claude-opus-4-5-20251101': 'claude-opus-4-5-20251101',
  'anthropic/claude-sonnet-4-5-20250929': 'claude-sonnet-4-5-20250929',
  'anthropic/claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',

  // Claude 4.x models (active)
  'anthropic/claude-opus-4': 'claude-opus-4-20250514',
  'anthropic/claude-opus-4-1': 'claude-opus-4-1-20250805',
  'anthropic/claude-opus-4.1': 'claude-opus-4-1-20250805',
  'anthropic/claude-sonnet-4': 'claude-sonnet-4-20250514',
  'anthropic/claude-opus-4-20250514': 'claude-opus-4-20250514',
  'anthropic/claude-opus-4-1-20250805': 'claude-opus-4-1-20250805',
  'anthropic/claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',

  // Claude 3 series (active)
  'anthropic/claude-3-haiku': 'claude-3-haiku-20240307',
  'anthropic/claude-3-haiku-20240307': 'claude-3-haiku-20240307',

  // Deprecated but still working (until retirement dates):
  'anthropic/claude-3-opus': 'claude-3-opus-20240229',
  'anthropic/claude-3-opus-20240229': 'claude-3-opus-20240229',
  'anthropic/claude-3.5-haiku': 'claude-3-5-haiku-20241022',
  'anthropic/claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022',
  'anthropic/claude-3.7-sonnet': 'claude-3-7-sonnet-20250219',
  'anthropic/claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
  'anthropic/claude-3.7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
};

/**
 * Transforms a model slug from OpenRouter format to direct API format
 *
 * @param provider - The provider type
 * @param modelSlug - The model slug from OpenRouter (e.g., "openai/gpt-4o")
 * @returns Transformed model slug for direct API use
 */
export function transformModelSlug(
  provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini',
  modelSlug: string
): string {
  // OpenRouter: pass through as-is
  if (provider === 'openrouter') {
    return modelSlug;
  }

  // Gemini: strip the "google/" prefix for direct API use
  if (provider === 'gemini') {
    return modelSlug.replace(/^google\//, '');
  }

  // OpenAI: simply strip the "openai/" prefix
  if (provider === 'openai') {
    return modelSlug.replace(/^openai\//, '');
  }

  // Anthropic: use mapping table for correct date suffix
  if (provider === 'anthropic') {
    // Check mapping table first
    const mappedModel = ANTHROPIC_MODEL_MAP[modelSlug];
    if (mappedModel) {
      return mappedModel;
    }

    // If model already has date suffix (format: model-YYYYMMDD), just strip prefix
    const withoutPrefix = modelSlug.replace(/^anthropic\//, '');
    if (/\d{8}$/.test(withoutPrefix)) {
      return withoutPrefix;
    }

    // Unknown model - fail with clear error
    throw new Error(
      `Unknown Anthropic model: ${modelSlug}. ` +
      `Please add mapping to ANTHROPIC_MODEL_MAP in lib/model-transformer.ts`
    );
  }

  return modelSlug;
}

/**
 * MAINTENANCE GUIDE:
 *
 * When Anthropic releases a new model or retires existing ones:
 * 1. Check Anthropic's model deprecation page: https://platform.claude.com/docs/en/about-claude/model-deprecations
 * 2. For RETIRED models: Update the filter in lib/fetch-models.ts getAnthropicModels() to hide them
 * 3. For DEPRECATED models: Keep them visible (they still work until retirement date)
 * 4. For NEW models: Check OpenRouter's model ID (e.g., "anthropic/claude-4.6-sonnet")
 * 5. Check Anthropic's official docs for canonical ID with date suffix
 * 6. Add mapping to ANTHROPIC_MODEL_MAP above
 * 7. Test via Settings > Test API Key
 *
 * Model Status (as of Dec 2025):
 * Active:
 * - Claude 3 Haiku (claude-3-haiku-20240307)
 * - Claude 4 series (Opus 4, Opus 4.1, Sonnet 4)
 * - Claude 4.5 series (Opus 4.5, Sonnet 4.5, Haiku 4.5)
 *
 * Deprecated (still working until retirement date):
 * - Claude 3 Opus (retires Jan 5, 2026)
 * - Claude 3.5 Haiku (retires Feb 19, 2026)
 * - Claude 3.7 Sonnet (retires Feb 19, 2026)
 *
 * Retired (no longer work - hidden from dropdown):
 * - Claude 2.0, 2.1 (retired July 21, 2025)
 * - Claude 3 Sonnet (retired July 21, 2025)
 * - Claude 3.5 Sonnet (retired Oct 28, 2025)
 *
 * Resources:
 * - Anthropic model status: https://platform.claude.com/docs/en/about-claude/model-deprecations
 * - OpenRouter models: https://openrouter.ai/api/v1/models
 * - Anthropic docs: https://docs.anthropic.com/en/docs/about-claude/models/overview
 * - OpenAI docs: https://platform.openai.com/docs/models
 */
