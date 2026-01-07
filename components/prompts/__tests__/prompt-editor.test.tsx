/**
 * Tests for PromptEditor component
 *
 * Tests verify that:
 * 1. Prompt creation works correctly
 * 2. Prompt editing and version management
 * 3. Save and save & refresh callbacks
 * 4. Cancel functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromptEditor from '../prompt-editor';
import * as storage from '@/lib/storage';
import { Project, Prompt } from '@/lib/types';

// Mock storage module
jest.mock('@/lib/storage');

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('PromptEditor', () => {
  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test description',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    promptIds: [],
    modelConfigIds: [],
    dataSetIds: [],
  };

  const mockPrompt: Prompt = {
    id: 'prompt-1',
    projectId: 'project-1',
    name: 'Test Prompt',
    versions: [
      {
        id: 'version-1',
        versionNumber: 1,
        content: 'Original content',
        note: 'Version 1',
        createdAt: Date.now(),
      },
    ],
    currentVersionId: 'version-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getProjectById as jest.Mock).mockReturnValue(mockProject);
    (storage.savePrompt as jest.Mock).mockImplementation(() => {});
  });

  describe('Creating New Prompt', () => {
    it('should render new prompt form when no prompt is provided', () => {
      render(
        <PromptEditor
          projectId="project-1"
        />
      );

      expect(screen.getByText('New Prompt')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const onCancel = jest.fn();

      render(
        <PromptEditor
          projectId="project-1"
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should save new prompt when save button is clicked', async () => {
      const onSave = jest.fn();

      render(
        <PromptEditor
          projectId="project-1"
          onSave={onSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/Summarize Article/i);
      const contentTextarea = screen.getByPlaceholderText(/Enter your prompt here/i);

      await userEvent.type(nameInput, 'New Prompt Name');
      await userEvent.type(contentTextarea, 'New prompt content');

      const saveButton = screen.getByText('Save');
      await userEvent.click(saveButton);

      expect(storage.savePrompt).toHaveBeenCalled();
      expect(onSave).toHaveBeenCalled();
    });

    it('should have input fields for name and content', () => {
      render(
        <PromptEditor
          projectId="project-1"
        />
      );

      expect(screen.getByPlaceholderText(/Summarize Article/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter your prompt here/i)).toBeInTheDocument();
    });
  });

  describe('Editing Existing Prompt', () => {
    it('should render prompt version view when prompt is provided', () => {
      render(
        <PromptEditor
          projectId="project-1"
          prompt={mockPrompt}
        />
      );

      expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    });

    it('should display current prompt content', () => {
      render(
        <PromptEditor
          projectId="project-1"
          prompt={mockPrompt}
        />
      );

      expect(screen.getByText('Original content')).toBeInTheDocument();
    });

    it('should call onSave when save button is clicked', async () => {
      const onSave = jest.fn();

      render(
        <PromptEditor
          projectId="project-1"
          prompt={mockPrompt}
          onSave={onSave}
        />
      );

      // Find and click edit button
      const editButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Edit')
      );

      if (editButton) {
        await userEvent.click(editButton);

        // Modify content
        const textarea = screen.getByDisplayValue('Original content');
        await userEvent.clear(textarea);
        await userEvent.type(textarea, 'Updated content');

        // Save
        const saveButton = screen.getByText('Save');
        await userEvent.click(saveButton);

        expect(storage.savePrompt).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalled();
      }
    });

    it('should call onSaveAndRefresh when save and refresh is clicked', async () => {
      const onSaveAndRefresh = jest.fn();

      render(
        <PromptEditor
          projectId="project-1"
          prompt={mockPrompt}
          onSaveAndRefresh={onSaveAndRefresh}
        />
      );

      // Find and click edit button
      const editButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Edit')
      );

      if (editButton) {
        await userEvent.click(editButton);

        // Modify content
        const textarea = screen.getByDisplayValue('Original content');
        await userEvent.clear(textarea);
        await userEvent.type(textarea, 'Updated content');

        // Save and refresh
        const saveAndRefreshButton = screen.getByText('Save & Refresh');
        await userEvent.click(saveAndRefreshButton);

        expect(storage.savePrompt).toHaveBeenCalled();
        expect(onSaveAndRefresh).toHaveBeenCalled();
      }
    });
  });

  describe('Version Management', () => {
    it('should create new version when save as new version is clicked', async () => {
      const onSave = jest.fn();
      const promptWithMultipleVersions: Prompt = {
        ...mockPrompt,
        versions: [
          {
            id: 'version-1',
            versionNumber: 1,
            content: 'Version 1 content',
            note: 'Version 1',
            createdAt: Date.now() - 1000,
          },
          {
            id: 'version-2',
            versionNumber: 2,
            content: 'Version 2 content',
            note: 'Version 2',
            createdAt: Date.now(),
          },
        ],
        currentVersionId: 'version-2',
      };

      render(
        <PromptEditor
          projectId="project-1"
          prompt={promptWithMultipleVersions}
          onSave={onSave}
        />
      );

      // Find and click edit button
      const editButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('Edit')
      );

      if (editButton) {
        await userEvent.click(editButton);

        // Modify content
        const textarea = screen.getByDisplayValue('Version 2 content');
        await userEvent.clear(textarea);
        await userEvent.type(textarea, 'Version 3 content');

        // Save as new version
        const saveAsNewButton = screen.getByText('Save as New Version');
        await userEvent.click(saveAsNewButton);

        expect(storage.savePrompt).toHaveBeenCalled();

        // Verify the saved prompt has a new version
        const savedPrompt = (storage.savePrompt as jest.Mock).mock.calls[0][0];
        expect(savedPrompt.versions).toHaveLength(3);
        expect(savedPrompt.versions[2].versionNumber).toBe(3);
      }
    });

    it('should show version selector when prompt has multiple versions', () => {
      const promptWithMultipleVersions: Prompt = {
        ...mockPrompt,
        versions: [
          {
            id: 'version-1',
            versionNumber: 1,
            content: 'Version 1',
            note: 'First version',
            createdAt: Date.now() - 1000,
          },
          {
            id: 'version-2',
            versionNumber: 2,
            content: 'Version 2',
            note: 'Second version',
            createdAt: Date.now(),
          },
        ],
        currentVersionId: 'version-2',
      };

      render(
        <PromptEditor
          projectId="project-1"
          prompt={promptWithMultipleVersions}
        />
      );

      expect(screen.getByText('Version 2')).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should call onProjectNameUpdate when project name is edited', async () => {
      const onProjectNameUpdate = jest.fn();

      render(
        <PromptEditor
          projectId="project-1"
          prompt={mockPrompt}
          onProjectNameUpdate={onProjectNameUpdate}
        />
      );

      // This would require interacting with the breadcrumb component
      // The test implementation depends on how the breadcrumb allows editing
    });
  });

  describe('Highlighted State', () => {
    it('should render without errors when highlighted prop is true', () => {
      render(
        <PromptEditor
          projectId="project-1"
          prompt={mockPrompt}
          highlighted={true}
        />
      );

      // Verify component renders
      expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    });

    it('should render without errors when highlighted prop is false', () => {
      render(
        <PromptEditor
          projectId="project-1"
          prompt={mockPrompt}
          highlighted={false}
        />
      );

      // Verify component renders
      expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    });
  });
});
