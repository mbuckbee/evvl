'use client';

import { useState, useEffect } from 'react';
import { loadEvalHistory, deleteEvalResult } from '@/lib/storage';
import { EvalResult } from '@/lib/types';

export default function HistoryPage() {
  const [history, setHistory] = useState<EvalResult[]>([]);
  const [selectedEval, setSelectedEval] = useState<EvalResult | null>(null);

  useEffect(() => {
    setHistory(loadEvalHistory());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this evaluation?')) {
      deleteEvalResult(id);
      setHistory(loadEvalHistory());
      if (selectedEval?.id === id) {
        setSelectedEval(null);
      }
    }
  };

  const exportToJson = (evalResult: EvalResult) => {
    const dataStr = JSON.stringify(evalResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eval-${evalResult.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCsv = (evalResult: EvalResult) => {
    const headers = ['Model', 'Content', 'Tokens', 'Latency (ms)', 'Rating', 'Notes'];
    const rows = evalResult.outputs.map(output => {
      const rating = evalResult.ratings.find(r => r.outputId === output.id);
      return [
        output.modelConfig.label,
        `"${output.content.replace(/"/g, '""')}"`,
        output.tokens || '',
        output.latency || '',
        rating?.score || '',
        `"${(rating?.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eval-${evalResult.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-[80%] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Evaluation History</h1>

      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No evaluations saved yet. Create one from the main page.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* List */}
          <div className="md:col-span-1 space-y-2">
            {history.map((evalResult) => (
              <div
                key={evalResult.id}
                className={`p-4 rounded-lg border cursor-pointer ${
                  selectedEval?.id === evalResult.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-200 hover:border-gray-400'
                }`}
                onClick={() => setSelectedEval(evalResult)}
              >
                <div className="text-sm text-gray-500 mb-1">
                  {new Date(evalResult.timestamp).toLocaleString()}
                </div>
                <div className="text-sm line-clamp-2">{evalResult.prompt}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {evalResult.outputs.length} outputs
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="md:col-span-2">
            {selectedEval ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      {new Date(selectedEval.timestamp).toLocaleString()}
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Prompt</h2>
                    <p className="text-gray-700 whitespace-pre-wrap mb-6">
                      {selectedEval.prompt}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => exportToJson(selectedEval)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => exportToCsv(selectedEval)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleDelete(selectedEval.id)}
                    className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>

                <h3 className="text-lg font-semibold mb-4">Outputs</h3>
                <div className="space-y-4">
                  {selectedEval.outputs.map((output) => {
                    const rating = selectedEval.ratings.find(
                      (r) => r.outputId === output.id
                    );
                    return (
                      <div
                        key={output.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{output.modelConfig.label}</h4>
                          {rating && (
                            <div className="text-yellow-500">
                              {'★'.repeat(rating.score)}
                              {'☆'.repeat(5 - rating.score)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 mb-2">
                          {output.tokens && <span>{output.tokens} tokens</span>}
                          {output.latency && <span>{output.latency}ms</span>}
                        </div>
                        <p className="text-sm whitespace-pre-wrap text-gray-700">
                          {output.content}
                        </p>
                        {rating?.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Notes:</strong> {rating.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center text-gray-500">
                Select an evaluation to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
