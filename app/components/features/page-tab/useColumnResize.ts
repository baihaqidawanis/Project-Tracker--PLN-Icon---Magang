'use client';

import { useState, useEffect, useRef } from 'react';
import { ResizingColumn, ColumnWidths } from './types';

interface UseColumnResizeProps {
  storageKeyWorkflow: string;
  storageKeyProgress: string;
  defaultWorkflowWidths: ColumnWidths;
  defaultProgressWidths: ColumnWidths;
}

export function useColumnResize({
  storageKeyWorkflow,
  storageKeyProgress,
  defaultWorkflowWidths,
  defaultProgressWidths
}: UseColumnResizeProps) {
  const [workflowColumnWidths, setWorkflowColumnWidths] = useState<ColumnWidths>(defaultWorkflowWidths);
  const [progressColumnWidths, setProgressColumnWidths] = useState<ColumnWidths>(defaultProgressWidths);
  const [resizingColumn, setResizingColumn] = useState<ResizingColumn | null>(null);

  const hasMountedRef = useRef(false);
  const widthsRef = useRef({ workflow: workflowColumnWidths, progress: progressColumnWidths });
  widthsRef.current = { workflow: workflowColumnWidths, progress: progressColumnWidths };

  // Load widths from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWorkflow = localStorage.getItem(storageKeyWorkflow);
      const savedProgress = localStorage.getItem(storageKeyProgress);
      
      if (savedWorkflow) {
        try {
          setWorkflowColumnWidths(prev => ({ ...prev, ...JSON.parse(savedWorkflow) }));
        } catch (e) {
          console.error('Failed to parse saved workflow widths', e);
        }
      }
      
      if (savedProgress) {
        try {
          setProgressColumnWidths(prev => ({ ...prev, ...JSON.parse(savedProgress) }));
        } catch (e) {
          console.error('Failed to parse saved progress widths', e);
        }
      }

      hasMountedRef.current = true;
    }
  }, [storageKeyWorkflow, storageKeyProgress]);

  // Save widths whenever they change (but not on initial mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && hasMountedRef.current) {
      localStorage.setItem(storageKeyWorkflow, JSON.stringify(workflowColumnWidths));
      localStorage.setItem(storageKeyProgress, JSON.stringify(progressColumnWidths));
    }
  }, [workflowColumnWidths, progressColumnWidths, storageKeyWorkflow, storageKeyProgress]);

  const handleColumnResizeStart = (e: React.MouseEvent, table: 'workflow' | 'progress', column: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = table === 'workflow' ? workflowColumnWidths[column] : progressColumnWidths[column];
    setResizingColumn({
      table,
      column,
      startX: e.clientX,
      startWidth
    });
  };

  // Global mouse move handler
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (resizingColumn) {
      const delta = e.clientX - resizingColumn.startX;
      const newWidth = Math.max(40, resizingColumn.startWidth + delta);

      if (resizingColumn.table === 'workflow') {
        setWorkflowColumnWidths(prev => ({
          ...prev,
          [resizingColumn.column]: newWidth
        }));
      } else {
        setProgressColumnWidths(prev => ({
          ...prev,
          [resizingColumn.column]: newWidth
        }));
      }
    }
  };

  const handleGlobalMouseUp = () => {
    if (resizingColumn) {
      setResizingColumn(null);
    }
  };

  return {
    workflowColumnWidths,
    progressColumnWidths,
    resizingColumn,
    handleColumnResizeStart,
    handleGlobalMouseMove,
    handleGlobalMouseUp
  };
}
