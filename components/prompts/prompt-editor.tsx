'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Prompt, PromptVersion } from '@/lib/types';
import { savePrompt } from '@/lib/storage';
import NewPromptForm from './new-prompt-form';
import PromptVersionView from './prompt-version-view';

interface PromptEditorProps {
  projectId: string;
  prompt?: Prompt; // If provided, we're editing. If not, we're creating.
  onSave?: (prompt: Prompt) => void;
  onCancel?: () => void;
  onSaveAndRefresh?: (prompt: Prompt) => void;
  highlighted?: boolean;
}

export default function PromptEditor({ projectId, prompt, onSave, onCancel, onSaveAndRefresh, highlighted }: PromptEditorProps) {
  // If viewing existing prompt, show view form
  if (prompt) {
    const handleSave = (content: string) => {
      // Update the latest version in place
      const latestVersion = prompt.versions.reduce((latest, current) =>
        current.versionNumber > latest.versionNumber ? current : latest
      , prompt.versions[0]);

      if (latestVersion) {
        const updatedVersions = prompt.versions.map(v =>
          v.id === latestVersion.id
            ? { ...v, content }
            : v
        );

        const updatedPrompt: Prompt = {
          ...prompt,
          versions: updatedVersions,
          currentVersionId: latestVersion.id, // Ensure currentVersionId points to latest
          updatedAt: Date.now(),
        };

        savePrompt(updatedPrompt);
        if (onSave) onSave(updatedPrompt);
      }
    };

    const handleSaveAndRefresh = (content: string) => {
      // Update the latest version in place
      const latestVersion = prompt.versions.reduce((latest, current) =>
        current.versionNumber > latest.versionNumber ? current : latest
      , prompt.versions[0]);

      if (latestVersion) {
        const updatedVersions = prompt.versions.map(v =>
          v.id === latestVersion.id
            ? { ...v, content }
            : v
        );

        const updatedPrompt: Prompt = {
          ...prompt,
          versions: updatedVersions,
          currentVersionId: latestVersion.id,
          updatedAt: Date.now(),
        };

        savePrompt(updatedPrompt);
        if (onSaveAndRefresh) onSaveAndRefresh(updatedPrompt);
      }
    };

    const handleSaveAsNewVersion = (content: string, versionNote?: string) => {
      // Create a new version
      const newVersionNumber = Math.max(...prompt.versions.map(v => v.versionNumber)) + 1;
      const newVersionId = uuidv4();

      const newVersion: PromptVersion = {
        id: newVersionId,
        versionNumber: newVersionNumber,
        content: content,
        note: versionNote || `Version ${newVersionNumber}`,
        createdAt: Date.now(),
      };

      const updatedPrompt: Prompt = {
        ...prompt,
        versions: [...prompt.versions, newVersion],
        currentVersionId: newVersionId,
        updatedAt: Date.now(),
      };

      savePrompt(updatedPrompt);
      if (onSave) onSave(updatedPrompt);
    };

    const handleNameUpdate = (name: string) => {
      // Update the prompt name
      const updatedPrompt: Prompt = {
        ...prompt,
        name: name,
        updatedAt: Date.now(),
      };

      savePrompt(updatedPrompt);
      if (onSave) onSave(updatedPrompt);
    };

    return (
      <PromptVersionView
        prompt={prompt}
        onCancel={onCancel}
        onSave={handleSave}
        onSaveAsNewVersion={handleSaveAsNewVersion}
        onNameUpdate={handleNameUpdate}
        onSaveAndRefresh={handleSaveAndRefresh}
        highlighted={highlighted}
      />
    );
  }

  // Show new prompt form
  return (
    <NewPromptForm
      onCancel={onCancel}
      onCreate={(name, content) => {
        // Create prompt with the provided name
        const versionId = uuidv4();
        const newPrompt: Prompt = {
          id: uuidv4(),
          projectId,
          name: name,
          description: undefined,
          versions: [
            {
              id: versionId,
              versionNumber: 1,
              content: content,
              note: 'Initial version',
              createdAt: Date.now(),
            },
          ],
          currentVersionId: versionId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        savePrompt(newPrompt);
        if (onSave) onSave(newPrompt);
      }}
    />
  );
}
