'use client';

import { useEffect } from 'react';

/**
 * Backroom Layout
 *
 * Forces light mode for admin pages
 */
export default function BackroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Force light mode for backroom
    document.documentElement.classList.remove('dark');

    // Restore dark mode when leaving backroom
    return () => {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  return <>{children}</>;
}
