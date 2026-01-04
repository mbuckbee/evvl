'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, PlusIcon, FolderIcon, DocumentTextIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  onRequestSelect?: (requestId: string) => void;
  onNewRequest?: () => void;
}

// Placeholder data structure (will be replaced with real data in Phase 2)
interface PlaceholderRequest {
  id: string;
  name: string;
}

interface PlaceholderCollection {
  id: string;
  name: string;
  requests: PlaceholderRequest[];
  isOpen: boolean;
}

export default function Sidebar({ onRequestSelect, onNewRequest }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collections, setCollections] = useState<PlaceholderCollection[]>([
    {
      id: '1',
      name: 'My Requests',
      isOpen: true,
      requests: [
        { id: 'req-1', name: 'GPT-4 Test' },
        { id: 'req-2', name: 'Claude Comparison' },
        { id: 'req-3', name: 'Image Generation' },
      ],
    },
    {
      id: '2',
      name: 'Examples',
      isOpen: false,
      requests: [
        { id: 'req-4', name: 'Summarization' },
        { id: 'req-5', name: 'Code Generation' },
      ],
    },
  ]);

  const toggleCollection = (collectionId: string) => {
    setCollections(prev =>
      prev.map(col =>
        col.id === collectionId ? { ...col, isOpen: !col.isOpen } : col
      )
    );
  };

  const handleRequestClick = (requestId: string) => {
    if (onRequestSelect) {
      onRequestSelect(requestId);
    }
  };

  const handleNewRequest = () => {
    if (onNewRequest) {
      onNewRequest();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Collections
        </h2>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* New Request Button */}
        <button
          onClick={handleNewRequest}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto">
        {collections.map((collection) => (
          <div key={collection.id} className="border-b border-gray-200 dark:border-gray-700">
            {/* Collection Header */}
            <button
              onClick={() => toggleCollection(collection.id)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              {collection.isOpen ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
              <FolderIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {collection.name}
              </span>
              <span className="ml-auto text-xs text-gray-500">
                {collection.requests.length}
              </span>
            </button>

            {/* Requests List */}
            {collection.isOpen && (
              <div className="bg-gray-50 dark:bg-gray-800">
                {collection.requests.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => handleRequestClick(request.id)}
                    className="w-full flex items-center gap-2 px-4 pl-10 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                  >
                    <DocumentTextIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {request.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>{collections.reduce((acc, col) => acc + col.requests.length, 0)} requests</span>
          <span>{collections.length} collections</span>
        </div>
      </div>
    </div>
  );
}
