'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, FolderIcon, DocumentTextIcon, ChevronRightIcon, ChevronDownIcon, SparklesIcon, CogIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { Project, Prompt, ProjectModelConfig, DataSet } from '@/lib/types';
import {
  loadProjects,
  loadUIState,
  saveUIState,
  saveProject,
  getPromptsByProjectId,
  getModelConfigsByProjectId,
  getDataSetsByProjectId,
} from '@/lib/storage';
import { migrateEvalHistory, isMigrationComplete } from '@/lib/migration';

interface SidebarProps {
  onNewProject?: () => void;
  onProjectSelect?: (projectId: string, shouldEdit?: boolean) => void;
  onNewPrompt?: (projectId: string) => void;
  onPromptSelect?: (promptId: string, shouldEdit?: boolean) => void;
  onNewModelConfig?: (projectId: string) => void;
  onModelConfigSelect?: (configId: string, shouldEdit?: boolean) => void;
  onNewDataSet?: (projectId: string) => void;
  onDataSetSelect?: (dataSetId: string, shouldEdit?: boolean) => void;
}

export default function Sidebar({ onNewProject, onProjectSelect, onNewPrompt, onPromptSelect, onNewModelConfig, onModelConfigSelect, onNewDataSet, onDataSetSelect }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [openProjects, setOpenProjects] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([]); // Track which sections are open (e.g., "projectId-prompts")

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
      // Default to prompts section open for the default project
      setOpenSections([`${defaultProject.id}-prompts`]);
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

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev =>
      prev.includes(sectionKey)
        ? prev.filter(key => key !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const handleProjectClick = (projectId: string) => {
    // Toggle the project folder
    const isOpen = openProjects.includes(projectId);

    if (isOpen) {
      // Close the project
      setOpenProjects(prev => prev.filter(id => id !== projectId));
    } else {
      // Open the project
      setOpenProjects(prev => [...prev, projectId]);

      // Expand the Prompts section by default when opening
      const promptsSection = `${projectId}-prompts`;
      if (!openSections.includes(promptsSection)) {
        setOpenSections(prev => [...prev, promptsSection]);
      }

      // Load the project (not editing)
      if (onProjectSelect) {
        onProjectSelect(projectId, false);
      }
    }
  };

  const handleProjectEditClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project toggle
    if (onProjectSelect) {
      onProjectSelect(projectId, true); // Edit mode
    }
  };

  const handleNewProjectClick = () => {
    if (onNewProject) {
      onNewProject();
    }
  };

  const handlePromptClick = (promptId: string, e: React.MouseEvent) => {
    if (onPromptSelect) {
      const shouldEdit = e.button === 2 || e.shiftKey; // Right-click or Shift+Click to edit
      onPromptSelect(promptId, shouldEdit);
    }
  };

  const handleNewPromptClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project toggle
    if (onNewPrompt) {
      onNewPrompt(projectId);
    }
  };

  const handleModelConfigClick = (configId: string, e: React.MouseEvent) => {
    if (onModelConfigSelect) {
      const shouldEdit = e.button === 2 || e.shiftKey; // Right-click or Shift+Click to edit
      onModelConfigSelect(configId, shouldEdit);
    }
  };

  const handleNewModelConfigClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project toggle
    if (onNewModelConfig) {
      onNewModelConfig(projectId);
    }
  };

  const handleDataSetClick = (dataSetId: string, e: React.MouseEvent) => {
    if (onDataSetSelect) {
      const shouldEdit = e.button === 2 || e.shiftKey; // Right-click or Shift+Click to edit
      onDataSetSelect(dataSetId, shouldEdit);
    }
  };

  const handleNewDataSetClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project toggle
    if (onNewDataSet) {
      onNewDataSet(projectId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Projects
          </h2>
          <button
            onClick={handleNewProjectClick}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects.map((project) => {
          const prompts = getPromptsByProjectId(project.id);
          const modelConfigs = getModelConfigsByProjectId(project.id);
          const dataSets = getDataSetsByProjectId(project.id);
          const isOpen = openProjects.includes(project.id);

          return (
            <div key={project.id} className="border-b border-gray-200 dark:border-gray-700">
              {/* Project Header */}
              <div className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <button
                  onClick={() => toggleProject(project.id)}
                  className="flex items-center gap-2"
                >
                  {isOpen ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                  )}
                </button>
                <button
                  onClick={() => handleProjectClick(project.id)}
                  className="flex items-center gap-2 flex-1 text-left relative group/project"
                >
                  <FolderIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </span>
                  {project.description && (
                    <span className="absolute top-full left-0 mt-2 hidden group-hover/project:block px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none z-10">
                      {project.description}
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => handleProjectEditClick(project.id, e)}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit project"
                >
                  Edit
                </button>
              </div>

              {/* Nested Sections */}
              {isOpen && (
                <div className="bg-gray-50 dark:bg-gray-800">
                  {/* Prompts Folder */}
                  <div>
                    <div className="w-full flex items-center gap-2 px-4 pl-8 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <button
                        onClick={() => toggleSection(`${project.id}-prompts`)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        {openSections.includes(`${project.id}-prompts`) ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                        )}
                        <SparklesIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Prompts
                        </span>
                      </button>
                      <button
                        onClick={(e) => handleNewPromptClick(project.id, e)}
                        className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded transition-colors"
                      >
                        New
                      </button>
                    </div>

                    {openSections.includes(`${project.id}-prompts`) && (
                      <div>
                        {/* Prompts */}
                        {prompts.length > 0 ? (
                          prompts.map((prompt) => (
                            <button
                              key={prompt.id}
                              onClick={(e) => handlePromptClick(prompt.id, e)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                handlePromptClick(prompt.id, e);
                              }}
                              className="w-full flex items-center gap-2 px-4 pl-14 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                              title="Click to edit"
                            >
                              <DocumentTextIcon className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-200 flex-shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                                {prompt.name}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 pl-14 py-2 text-xs text-gray-600 dark:text-gray-300 italic">
                            No prompts yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Model Configs Folder */}
                  <div>
                    <div className="w-full flex items-center gap-2 px-4 pl-8 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <button
                        onClick={() => toggleSection(`${project.id}-configs`)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        {openSections.includes(`${project.id}-configs`) ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                        )}
                        <CogIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Model Configs
                        </span>
                      </button>
                      <button
                        onClick={(e) => handleNewModelConfigClick(project.id, e)}
                        className="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded transition-colors"
                      >
                        New
                      </button>
                    </div>

                    {openSections.includes(`${project.id}-configs`) && (
                      <div>
                        {/* Model Configs */}
                        {modelConfigs.length > 0 ? (
                          modelConfigs.map((config) => (
                            <button
                              key={config.id}
                              onClick={(e) => handleModelConfigClick(config.id, e)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                handleModelConfigClick(config.id, e);
                              }}
                              className="w-full flex items-center gap-2 px-4 pl-14 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                              title="Click to edit"
                            >
                              <CogIcon className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-200 flex-shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                                {config.name}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 pl-14 py-2 text-xs text-gray-600 dark:text-gray-300 italic">
                            No model configs yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Data Sets Folder */}
                  <div>
                    <div className="w-full flex items-center gap-2 px-4 pl-8 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <button
                        onClick={() => toggleSection(`${project.id}-datasets`)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        {openSections.includes(`${project.id}-datasets`) ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                        )}
                        <TableCellsIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Data Sets
                        </span>
                      </button>
                      <button
                        onClick={(e) => handleNewDataSetClick(project.id, e)}
                        className="px-2 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded transition-colors"
                      >
                        New
                      </button>
                    </div>

                    {openSections.includes(`${project.id}-datasets`) && (
                      <div>
                        {/* Data Sets */}
                        {dataSets.length > 0 ? (
                          dataSets.map((dataSet) => (
                            <button
                              key={dataSet.id}
                              onClick={(e) => handleDataSetClick(dataSet.id, e)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                handleDataSetClick(dataSet.id, e);
                              }}
                              className="w-full flex items-center gap-2 px-4 pl-14 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                              title="Click to edit"
                            >
                              <TableCellsIcon className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-200 flex-shrink-0" />
                              <span className="text-sm text-gray-900 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                                {dataSet.name}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 pl-14 py-2 text-xs text-gray-600 dark:text-gray-300 italic">
                            No data sets yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Sponsored link */}
        <a
          href="https://knowatoa.com?ref=evvl"
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-3 mt-10 text-sm text-center text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <img
              src="/knowatoa-icon-light.svg"
              alt="Knowatoa"
              className="w-16 h-16 rounded dark:hidden"
            />
            <img
              src="/knowatoa-icon-dark.svg"
              alt="Knowatoa"
              className="w-16 h-16 rounded hidden dark:block"
            />
          </div>
          <p className="mt-2">If you found this project useful, you'll probably also appreciate Knowatoa.</p>
        </a>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex items-center justify-between">
          <span>
            {projects.reduce((acc, p) =>
              acc + getPromptsByProjectId(p.id).length +
              getModelConfigsByProjectId(p.id).length +
              getDataSetsByProjectId(p.id).length, 0
            )} items
          </span>
          <span>{projects.length} projects</span>
        </div>
      </div>
    </div>
  );
}
