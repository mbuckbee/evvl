'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Project, ProjectModelConfig } from '@/lib/types';
import { saveProject, deleteProject, saveModelConfig } from '@/lib/storage';

interface ProjectEditorProps {
  project?: Project;
  onSave?: (project: Project) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export default function ProjectEditor({ project, onSave, onCancel, onDelete }: ProjectEditorProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');

  const handleDelete = () => {
    if (!project) return;

    const confirmMessage = `Are you sure you want to delete "${project.name}"? This will also delete all prompts and model configs in this project. This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      deleteProject(project.id);
      if (onDelete) onDelete();
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please provide a project name');
      return;
    }

    if (project) {
      // Editing existing project
      const updatedProject: Project = {
        ...project,
        name: name.trim(),
        description: description.trim() || undefined,
        updatedAt: Date.now(),
      };

      saveProject(updatedProject);
      if (onSave) onSave(updatedProject);
    } else {
      // Creating new project
      const newProjectId = uuidv4();
      const newProject: Project = {
        id: newProjectId,
        name: name.trim(),
        description: description.trim() || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        promptIds: [],
        modelConfigIds: [],
        dataSetIds: [],
      };

      saveProject(newProject);

      // Create default model configs for the new project
      const defaultConfigs = [
        {
          id: uuidv4(),
          projectId: newProjectId,
          name: 'GPT-4',
          provider: 'openai' as const,
          model: 'gpt-4',
          createdAt: Date.now(),
        },
        {
          id: uuidv4(),
          projectId: newProjectId,
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic' as const,
          model: 'claude-3-5-sonnet-20241022',
          createdAt: Date.now(),
        },
        {
          id: uuidv4(),
          projectId: newProjectId,
          name: 'OpenRouter GPT-4',
          provider: 'openrouter' as const,
          model: 'openai/gpt-4',
          createdAt: Date.now(),
        },
        {
          id: uuidv4(),
          projectId: newProjectId,
          name: 'Gemini Pro',
          provider: 'gemini' as const,
          model: 'gemini-pro',
          createdAt: Date.now(),
        },
      ];

      // Save all default configs
      defaultConfigs.forEach(config => saveModelConfig(config));

      if (onSave) onSave(newProject);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          {project && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Delete project"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
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
            Project Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Client Evaluation, Blog Post Generator"
            autoFocus
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project for?"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
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
          {project ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </div>
  );
}
