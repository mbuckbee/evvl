'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadApiKeys } from '@/lib/storage';

export default function Navigation() {
  const [hasKeys, setHasKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const keys = loadApiKeys();
    const hasAnyKey = !!(keys.openai || keys.anthropic);
    setHasKeys(hasAnyKey);
    setIsLoading(false);
  }, []);

  // Don't render anything while checking
  if (isLoading) {
    return null;
  }

  // Don't show nav if no keys configured
  if (!hasKeys) {
    return null;
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            Evvl
          </Link>
          <div className="flex gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Eval
            </Link>
            <Link
              href="/history"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              History
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
