'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface ThreePanelLayoutProps {
  sidebar: ReactNode;
  requestPanel: ReactNode;
  responsePanel: ReactNode;
}

const STORAGE_KEY = 'evvl_ui_state';
const DEFAULT_SIDEBAR_WIDTH = 280;
const DEFAULT_REQUEST_WIDTH = 500;
const MIN_PANEL_WIDTH = 200;

interface UIState {
  sidebarWidth: number;
  requestWidth: number;
}

export default function ThreePanelLayout({
  sidebar,
  requestPanel,
  responsePanel,
}: ThreePanelLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [requestWidth, setRequestWidth] = useState(DEFAULT_REQUEST_WIDTH);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingRequest, setIsResizingRequest] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved panel sizes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: UIState = JSON.parse(saved);
        if (state.sidebarWidth) setSidebarWidth(state.sidebarWidth);
        if (state.requestWidth) setRequestWidth(state.requestWidth);
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save panel sizes to localStorage
  useEffect(() => {
    const state: UIState = {
      sidebarWidth,
      requestWidth,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [sidebarWidth, requestWidth]);

  // Handle sidebar resize
  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  // Handle request panel resize
  const handleRequestMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRequest(true);
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      if (isResizingSidebar) {
        const newWidth = e.clientX - containerRect.left;
        if (newWidth >= MIN_PANEL_WIDTH && newWidth <= containerRect.width - MIN_PANEL_WIDTH * 2) {
          setSidebarWidth(newWidth);
        }
      }

      if (isResizingRequest) {
        const newWidth = e.clientX - containerRect.left - sidebarWidth;
        if (newWidth >= MIN_PANEL_WIDTH && newWidth <= containerRect.width - sidebarWidth - MIN_PANEL_WIDTH) {
          setRequestWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingRequest(false);
    };

    if (isResizingSidebar || isResizingRequest) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingSidebar, isResizingRequest, sidebarWidth]);

  return (
    <div ref={containerRef} className="flex h-full w-full">
      {/* Left Sidebar */}
      <div
        className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
        style={{ width: `${sidebarWidth}px` }}
      >
        {sidebar}
      </div>

      {/* Sidebar Resize Handle */}
      <div
        className="w-1 cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50 transition-colors relative group"
        onMouseDown={handleSidebarMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Request Panel */}
      <div
        className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden"
        style={{ width: `${requestWidth}px` }}
      >
        {requestPanel}
      </div>

      {/* Request Panel Resize Handle */}
      <div
        className="w-1 cursor-col-resize hover:bg-blue-500 hover:bg-opacity-50 transition-colors relative group"
        onMouseDown={handleRequestMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      {/* Response Panel */}
      <div className="flex-1 bg-white dark:bg-gray-900 overflow-hidden">
        {responsePanel}
      </div>
    </div>
  );
}
