import { NextResponse } from 'next/server';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

/**
 * API route to fetch models from OpenRouter
 * Uses Next.js Data Cache with 5-minute revalidation
 * This cache is shared across all serverless instances
 */
export async function GET() {
  try {
    console.log('Fetching models from OpenRouter (with Next.js cache)');

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
      // Next.js Data Cache - shared across all instances
      // Revalidates every 5 minutes (300 seconds)
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`Returning ${data.data.length} models`);

    return NextResponse.json({
      models: data.data,
      totalModels: data.data.length,
      cached: true, // Next.js handles caching automatically
    });
  } catch (error) {
    console.error('Error fetching models:', error);

    return NextResponse.json(
      { error: 'Failed to fetch models from OpenRouter' },
      { status: 500 }
    );
  }
}

// Configure route segment options
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-static'; // Enable static generation with revalidation
