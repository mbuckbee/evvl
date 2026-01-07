'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';

interface TwoColumnLayoutProps {
  sidebar: ReactNode;
  topPanel: ReactNode;
  bottomPanel: ReactNode;
}

export default function TwoColumnLayout({ sidebar, topPanel, bottomPanel }: TwoColumnLayoutProps) {
  const [topHeight, setTopHeight] = useState(40); // 40% by default
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !isDragging) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const mouseY = e.clientY - containerRect.top;
      const mousePercent = (mouseY / containerHeight) * 100;

      // Constrain between 20% and 80%
      const newTopHeight = Math.min(Math.max(mousePercent, 20), 80);
      setTopHeight(newTopHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const bottomHeight = 100 - topHeight;

  return (
    <div className="h-full flex">
      {/* Left Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
        {sidebar}
      </div>

      {/* Right Side - Split Two Panels */}
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
        {/* Top Panel - Prompt/Config/Project Editor */}
        <div
          style={{ height: `${topHeight}%` }}
          className="overflow-auto border-b border-gray-200 dark:border-gray-700"
        >
          {topPanel}
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`h-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-row-resize transition-colors ${
            isDragging ? 'bg-blue-500' : ''
          }`}
        />

        {/* Bottom Panel - Responses or Data Set Editor */}
        <div
          style={{ height: `${bottomHeight}%` }}
          className="overflow-auto"
        >
          {bottomPanel}
        </div>
      </div>
    </div>
  );
}
