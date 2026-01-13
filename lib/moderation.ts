// OpenAI Moderation API wrapper for content safety checks

interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    harassment: boolean;
    'harassment/threatening': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: Record<string, number>;
}

interface ModerationResponse {
  id: string;
  model: string;
  results: ModerationResult[];
}

export interface ModerationCheckResult {
  passed: boolean;
  flaggedCategories: string[];
  error?: string;
}

/**
 * Check content against OpenAI's moderation API
 * This is FREE to use and doesn't require an API key with billing
 */
export async function checkModeration(content: string): Promise<ModerationCheckResult> {
  // Skip empty content
  if (!content || content.trim().length === 0) {
    return { passed: true, flaggedCategories: [] };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The moderation endpoint works without an API key for basic use
        // but having one improves rate limits
        ...(process.env.OPENAI_API_KEY && {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        })
      },
      body: JSON.stringify({
        input: content,
        model: 'omni-moderation-latest'
      })
    });

    if (!response.ok) {
      // If moderation API fails, we should still allow the share
      // but log the error for monitoring
      console.error('Moderation API error:', response.status, await response.text());
      return { passed: true, flaggedCategories: [], error: 'Moderation check unavailable' };
    }

    const data: ModerationResponse = await response.json();
    const result = data.results[0];

    if (!result.flagged) {
      return { passed: true, flaggedCategories: [] };
    }

    // Collect all flagged categories
    const flaggedCategories = Object.entries(result.categories)
      .filter(([, flagged]) => flagged)
      .map(([category]) => category);

    return {
      passed: false,
      flaggedCategories
    };
  } catch (error) {
    console.error('Moderation check failed:', error);
    // On error, allow the share but log it
    return { passed: true, flaggedCategories: [], error: 'Moderation check failed' };
  }
}

/**
 * Check multiple pieces of content (prompt + responses)
 */
export async function checkContentForSharing(
  prompt: string,
  systemPrompt?: string,
  responses?: string[]
): Promise<ModerationCheckResult> {
  // Combine all text content for a single check
  const contentParts = [prompt];
  if (systemPrompt) contentParts.push(systemPrompt);
  if (responses) contentParts.push(...responses);

  const combinedContent = contentParts.join('\n\n---\n\n');

  return checkModeration(combinedContent);
}
