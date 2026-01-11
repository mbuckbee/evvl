'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEvalById, saveEvalResult } from '@/lib/storage';
import { EvalResult, Rating } from '@/lib/types';
import OutputCard from '@/components/output-card';
import Link from 'next/link';

export default function EvalPageClient() {
  const params = useParams();
  const router = useRouter();
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    if (params.id) {
      const result = getEvalById(params.id as string);
      if (result) {
        setEvalResult(result);
        setRatings(result.ratings);
      } else {
        // Redirect to home if eval not found
        router.push('/');
      }
    }
  }, [params.id, router]);

  const handleRating = (outputId: string, score: number, notes?: string) => {
    if (!evalResult) return;

    const newRatings = ratings.find(r => r.outputId === outputId)
      ? ratings.map(r => r.outputId === outputId ? { ...r, score, notes } : r)
      : [...ratings, { outputId, score, notes }];

    setRatings(newRatings);

    // Update the saved eval result
    const updatedEval: EvalResult = {
      ...evalResult,
      ratings: newRatings,
    };
    saveEvalResult(updatedEval);
  };

  if (!evalResult) {
    return (
      <div className="w-full mx-auto px-4 py-8">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-block transition-colors">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-3 text-gray-900">Evaluation Results</h1>
        <p className="text-gray-500 text-sm">
          {new Date(evalResult.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Prompt Display */}
      <div className="mb-10 card p-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Prompt</h2>
        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{evalResult.prompt}</p>
      </div>

      {/* Outputs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {evalResult.outputs.map((output) => (
          <OutputCard
            key={output.id}
            output={output}
            rating={ratings.find(r => r.outputId === output.id)}
            onRate={handleRating}
          />
        ))}
      </div>
    </div>
  );
}
