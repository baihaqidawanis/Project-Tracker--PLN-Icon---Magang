'use client';

import { useState, useEffect, useRef } from 'react';
import { WorkflowRow, ProgressRow, SaveStatus } from './types';

interface UseAutoSaveProps {
  selectedPageId: number | null;
  workflowRows: WorkflowRow[];
  progressRows: ProgressRow[];
  setWorkflowRows: React.Dispatch<React.SetStateAction<WorkflowRow[]>>;
  setProgressRows: React.Dispatch<React.SetStateAction<ProgressRow[]>>;
  onSyncBeforeUnmount?: (pageId: number, workflows: any[], progress: any[]) => void;
}

export function useAutoSave({
  selectedPageId,
  workflowRows,
  progressRows,
  setWorkflowRows,
  setProgressRows,
  onSyncBeforeUnmount
}: UseAutoSaveProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for save-on-unmount
  const workflowRowsRef = useRef(workflowRows);
  const progressRowsRef = useRef(progressRows);
  const selectedPageIdRef = useRef(selectedPageId);

  useEffect(() => {
    workflowRowsRef.current = workflowRows;
  }, [workflowRows]);

  useEffect(() => {
    progressRowsRef.current = progressRows;
  }, [progressRows]);

  useEffect(() => {
    selectedPageIdRef.current = selectedPageId;
  }, [selectedPageId]);

  const saveDirtyRows = async () => {
    if (!selectedPageId) {
      console.log('[AutoSave] No selectedPageId, skipping');
      return;
    }
    console.log('[AutoSave] Starting save, pageId:', selectedPageId);
    setSaveStatus('saving');

    try {
      // 1. Save Workflows
      const updatedWorkflows = [...workflowRows];
      let workflowChanges = false;

      for (let i = 0; i < updatedWorkflows.length; i++) {
        const row = updatedWorkflows[i];
        if (row.isDirty) {
          workflowChanges = true;
          const method = row.isNew ? 'POST' : 'PUT';
          const { isNew, isDirty, type, clientId, ...rowPayload } = row;
          const body = { ...rowPayload, pageId: selectedPageId, sortOrder: i };

          console.log('[AutoSave] Saving workflow:', method, body);
          const res = await fetch('/api/workflows', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          if (res.ok) {
            const savedData = await res.json();
            console.log('[AutoSave] Workflow saved:', savedData);
            updatedWorkflows[i] = {
              ...updatedWorkflows[i],
              id: savedData.id || row.id,
              sortOrder: i,
              isNew: false,
              isDirty: false
            };
          } else {
            console.error('[AutoSave] Workflow save failed:', res.status, await res.text());
          }
        }
      }

      // 2. Save Progress
      const updatedProgress = [...progressRows];
      let progressChanges = false;

      for (let i = 0; i < updatedProgress.length; i++) {
        const row = updatedProgress[i];
        if (row.isDirty) {
          progressChanges = true;
          const method = row.isNew ? 'POST' : 'PUT';
          const { isNew, isDirty, clientId, ...rowPayload } = row;
          const body = { ...rowPayload, pageId: selectedPageId, sortOrder: i };

          const res = await fetch('/api/daily-progress', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          if (res.ok) {
            const savedData = await res.json();
            updatedProgress[i] = {
              ...updatedProgress[i],
              id: savedData.id || row.id,
              sortOrder: i,
              isNew: false,
              isDirty: false
            };
          }
        }
      }

      if (workflowChanges) {
        setWorkflowRows(updatedWorkflows);
      }
      if (progressChanges) {
        setProgressRows(updatedProgress);
      }

      setSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
    }
  };

  // Trigger Auto-Save
  useEffect(() => {
    const hasDirtyWorkflow = workflowRows.some(r => r.isDirty);
    const hasDirtyProgress = progressRows.some(r => r.isDirty);
    
    console.log('[AutoSave Trigger] workflows:', workflowRows.length, 'dirty:', hasDirtyWorkflow, 'progress:', progressRows.length, 'dirty:', hasDirtyProgress, 'pageId:', selectedPageId);

    if ((hasDirtyWorkflow || hasDirtyProgress) && selectedPageId) {
      console.log('[AutoSave Trigger] Will save in 500ms');
      setSaveStatus('saving');

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

      autoSaveTimerRef.current = setTimeout(() => {
        saveDirtyRows();
      }, 500);
    } else {
      setSaveStatus('saved');
    }

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [workflowRows, progressRows]);

  // Save on Unmount Effect
  useEffect(() => {
    return () => {
      const pageId = selectedPageIdRef.current;
      if (!pageId) return;

      const workflows = workflowRowsRef.current;
      const progress = progressRowsRef.current;

      const dirtyWorkflows = workflows.filter(r => r.isDirty);
      const dirtyProgress = progress.filter(r => r.isDirty);

      // Save any remaining dirty data to DB
      if (dirtyWorkflows.length > 0 || dirtyProgress.length > 0) {
        // Save Workflows
        dirtyWorkflows.forEach(row => {
          const method = row.isNew ? 'POST' : 'PUT';
          const { isNew, isDirty, type, clientId, ...rowPayload } = row;
          const body = { ...rowPayload, pageId: pageId, sortOrder: row.sortOrder ?? 0 };

          fetch('/api/workflows', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true
          }).catch(err => console.error('Unmount save failed', err));
        });

        // Save Progress
        dirtyProgress.forEach(row => {
          const method = row.isNew ? 'POST' : 'PUT';
          const { isNew, isDirty, clientId, ...rowPayload } = row;
          const body = { ...rowPayload, pageId: pageId, sortOrder: row.sortOrder ?? 0 };

          fetch('/api/daily-progress', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true
          }).catch(err => console.error('Unmount save failed', err));
        });
      }

      // ALWAYS sync current state to parent on unmount
      if (onSyncBeforeUnmount) {
        onSyncBeforeUnmount(pageId, workflows, progress);
      }
    };
  }, [onSyncBeforeUnmount]);

  return {
    saveStatus,
    saveDirtyRows
  };
}
