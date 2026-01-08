'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DataSet, DataSetItem } from '@/lib/types';
import { saveDataSet } from '@/lib/storage';

interface DataSetEditorProps {
  projectId: string;
  dataSet?: DataSet;
  onSave?: (dataSet: DataSet) => void;
  onCancel?: () => void;
}

export default function DataSetEditor({ projectId, dataSet, onSave, onCancel }: DataSetEditorProps) {
  const [name, setName] = useState(dataSet?.name || '');
  const [csvContent, setCsvContent] = useState('');

  useEffect(() => {
    if (dataSet && dataSet.items.length > 0) {
      // Convert data set items back to CSV format
      const firstItem = dataSet.items[0];
      const columns = Object.keys(firstItem.variables);

      // Create header row
      const header = columns.join(',');

      // Create data rows
      const rows = dataSet.items.map(item =>
        columns.map(col => {
          const value = item.variables[col] || '';
          // Escape values that contain commas or quotes
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );

      setCsvContent([header, ...rows].join('\n'));
    }
  }, [dataSet]);

  const parseCSV = (csv: string): { columns: string[], rows: Record<string, string>[] } => {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) {
      return { columns: [], rows: [] };
    }

    // Simple CSV parser (handles basic cases)
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // First row is column names
    const columns = parseLine(lines[0]);

    // Remaining rows are data
    const rows = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = parseLine(line);
        const row: Record<string, string> = {};
        columns.forEach((col, i) => {
          row[col] = values[i] || '';
        });
        return row;
      });

    return { columns, rows };
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a data set name');
      return;
    }

    const { columns, rows } = parseCSV(csvContent);

    if (columns.length === 0) {
      alert('Please add CSV data with column names in the first row');
      return;
    }

    // Convert rows to DataSetItems
    const items: DataSetItem[] = rows
      .filter(row => Object.values(row).some(val => val.trim())) // Filter out completely empty rows
      .map(row => ({
        id: uuidv4(),
        variables: row,
      }));

    const newDataSet: DataSet = {
      id: dataSet?.id || uuidv4(),
      projectId,
      name: name.trim(),
      items,
      createdAt: dataSet?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    saveDataSet(newDataSet);
    if (onSave) onSave(newDataSet);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {dataSet ? 'Edit Data Set' : 'New Data Set'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Test Articles"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* CSV Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CSV Data *
          </label>
          <textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder={`Paste CSV data here. First row of items becomes variables for use in the prompt.

Example:

title,category,content
First Article,Technology,Article about tech
Second Article,Science,Article about science

In your prompt, use: Summarize this {{category}} article titled "{{title}}": {{content}}`}
            rows={15}
            className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            First row should be column names (variable names for your prompts). Use {'{{'} columnName {'}}'}  in your prompt to substitute values.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </div>
  );
}
