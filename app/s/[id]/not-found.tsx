import Link from 'next/link';
import Image from 'next/image';
import { ClockIcon } from '@heroicons/react/24/outline';

export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/evvl-logo.png"
              alt="Evvl"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="font-semibold text-gray-900 dark:text-white">Evvl</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
            <ClockIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Share Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
            This shared evaluation has expired or doesn't exist. Shares are automatically deleted after 7 days.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Evvl
          </Link>
        </div>
      </main>
    </div>
  );
}
