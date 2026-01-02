'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const [hasClickedAbout, setHasClickedAbout] = useState(true); // Default true to avoid flash

  useEffect(() => {
    // Check if user has clicked the "What is this?" button before
    const clicked = localStorage.getItem('hasClickedAbout');
    setHasClickedAbout(clicked === 'true');
  }, []);

  const handleAboutClick = () => {
    localStorage.setItem('hasClickedAbout', 'true');
    setHasClickedAbout(true);
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image src="/evvl-logo.png" alt="Evvl" width={80} height={32} />
          </Link>
          <div className="flex gap-4 items-center">
            <Link
              href="/settings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/about"
              onClick={handleAboutClick}
              className={`px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm ${!hasClickedAbout ? 'animate-pulse-ring' : ''}`}
            >
              What is this?
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
