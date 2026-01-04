'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, FolderIcon, DocumentTextIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { Project, Prompt } from '@/lib/types';
import {
  loadProjects,
  loadUIState,
  saveUIState,
  saveProject,
  getPromptsByProjectId,
} from '@/lib/storage';
import { migrateEvalHistory, isMigrationComplete } from '@/lib/migration';

interface SidebarProps {
  onRequestSelect?: (requestId: string) => void;
  onNewRequest?: () => void;
  onProjectSelect?: (projectId: string) => void;
}

export default function Sidebar({ onRequestSelect, onNewRequest, onProjectSelect }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [openProjects, setOpenProjects] = useState<string[]>([]);

  // Load projects and run migration on mount
  useEffect(() => {
    // Run migration if not completed
    if (!isMigrationComplete()) {
      migrateEvalHistory();
    }

    // Load projects
    const loadedProjects = loadProjects();
    setProjects(loadedProjects);

    // Load UI state
    const uiState = loadUIState();
    setOpenProjects(uiState.openProjects || []);

    // If no projects exist, create a default one
    if (loadedProjects.length === 0) {
      const defaultProject: Project = {
        id: uuidv4(),
        name: 'My Project',
        description: 'Get started by creating prompts and model configs',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        promptIds: [],
        modelConfigIds: [],
        dataSetIds: [],
      };
      saveProject(defaultProject);
      setProjects([defaultProject]);
      setOpenProjects([defaultProject.id]);
    }
  }, []);

  // Save UI state when open projects change
  useEffect(() => {
    const uiState = loadUIState();
    saveUIState({ ...uiState, openProjects });
  }, [openProjects]);

  const toggleProject = (projectId: string) => {
    setOpenProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleProjectClick = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  const handleNewProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      name: `New Project ${projects.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      promptIds: [],
      modelConfigIds: [],
      dataSetIds: [],
    };
    saveProject(newProject);
    setProjects([...projects, newProject]);
    setOpenProjects([...openProjects, newProject.id]);
  };

  const handlePromptClick = (promptId: string) => {
    if (onRequestSelect) {
      onRequestSelect(promptId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Projects
        </h2>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* New Project Button */}
        <button
          onClick={handleNewProject}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects.map((project) => {
          const prompts = getPromptsByProjectId(project.id);
          const isOpen = openProjects.includes(project.id);

          return (
            <div key={project.id} className="border-b border-gray-200 dark:border-gray-700">
              {/* Project Header */}
              <button
                onClick={() => toggleProject(project.id)}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                {isOpen ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
                <FolderIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {project.name}
                </span>
                <span className="ml-auto text-xs text-gray-500">
                  {prompts.length}
                </span>
              </button>

              {/* Prompts List */}
              {isOpen && (
                <div className="bg-gray-50 dark:bg-gray-800">
                  {prompts.length > 0 ? (
                    prompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handlePromptClick(prompt.id)}
                        className="w-full flex items-center gap-2 px-4 pl-10 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                      >
                        <DocumentTextIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                          {prompt.name}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 pl-10 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      No prompts yet
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>{projects.reduce((acc, p) => acc + getPromptsByProjectId(p.id).length, 0)} prompts</span>
          <span>{projects.length} projects</span>
        </div>
      </div>
    </div>
  );
}
