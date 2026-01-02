'use client';

import { AIOutput, Rating } from '@/lib/types';
import { useState } from 'react';

interface OutputCardProps {
  output: AIOutput;
  rating?: Rating;
  onRate: (outputId: string, score: number, notes?: string) => void;
}

export default function OutputCard({ output, rating, onRate }: OutputCardProps) {
  const [notes, setNotes] = useState(rating?.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const handleStarClick = (score: number) => {
    onRate(output.id, score, notes);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (rating) {
      onRate(output.id, rating.score, value);
    }
  };

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-sm text-gray-900">{output.modelConfig.label}</h3>
        <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
          {output.tokens !== undefined && <span>{output.tokens} tokens</span>}
          {output.latency !== undefined && <span>{output.latency}ms</span>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-auto">
        {output.error ? (
          <div className="text-red-600 text-sm">
            Error: {output.error}
          </div>
        ) : output.type === 'image' && output.imageUrl ? (
          <div className="space-y-3">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={output.imageUrl}
                alt={output.content}
                className="w-full h-auto"
              />
            </div>
            {output.content && (
              <div className="text-xs text-gray-500 italic">
                {output.content}
              </div>
            )}
          </div>
        ) : (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
            {output.content}
          </div>
        )}
      </div>

      {/* Rating Section */}
      {!output.error && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          {/* Star Rating */}
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => handleStarClick(score)}
                className="text-2xl text-yellow-400 hover:scale-110 transition-transform focus:outline-none"
                aria-label={`Rate ${score} stars`}
              >
                {rating && rating.score >= score ? '★' : '☆'}
              </button>
            ))}
          </div>

          {/* Notes Toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {showNotes ? 'Hide notes' : 'Add notes'}
          </button>

          {/* Notes Input */}
          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes about this output..."
              rows={2}
              className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          )}
        </div>
      )}
    </div>
  );
}
