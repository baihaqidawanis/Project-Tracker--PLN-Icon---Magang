'use client';

import { useState, useEffect } from 'react';

interface UseZoomControlProps {
  storageKeyWorkflow: string;
  storageKeyProgress: string;
  storageKeyCompact: string;
  defaultWorkflowZoom?: number;
  defaultProgressZoom?: number;
  defaultCompactMode?: boolean;
}

export function useZoomControl({
  storageKeyWorkflow,
  storageKeyProgress,
  storageKeyCompact,
  defaultWorkflowZoom = 100,
  defaultProgressZoom = 100,
  defaultCompactMode = false
}: UseZoomControlProps) {
  const [workflowZoom, setWorkflowZoom] = useState(defaultWorkflowZoom);
  const [progressZoom, setProgressZoom] = useState(defaultProgressZoom);
  const [compactMode, setCompactMode] = useState(defaultCompactMode);

  // Load zoom settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWorkflowZoom = localStorage.getItem(storageKeyWorkflow);
      const savedProgressZoom = localStorage.getItem(storageKeyProgress);
      const savedCompactMode = localStorage.getItem(storageKeyCompact);

      if (savedWorkflowZoom) setWorkflowZoom(parseInt(savedWorkflowZoom));
      if (savedProgressZoom) setProgressZoom(parseInt(savedProgressZoom));
      if (savedCompactMode) setCompactMode(savedCompactMode === 'true');
    }
  }, [storageKeyWorkflow, storageKeyProgress, storageKeyCompact]);

  // Save zoom settings whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKeyWorkflow, workflowZoom.toString());
    }
  }, [workflowZoom, storageKeyWorkflow]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKeyProgress, progressZoom.toString());
    }
  }, [progressZoom, storageKeyProgress]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKeyCompact, compactMode.toString());
    }
  }, [compactMode, storageKeyCompact]);

  // Gesture-based zoom handlers
  useEffect(() => {
    const workflowContainer = document.getElementById('workflow-table-container');
    const progressContainer = document.getElementById('progress-table-container');

    // Wheel event handlers (Ctrl+Scroll)
    const handleWorkflowWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.1;
        setWorkflowZoom(prev => {
          const newZoom = prev + delta;
          return Math.round(Math.min(200, Math.max(30, newZoom)));
        });
      }
    };

    const handleProgressWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.1;
        setProgressZoom(prev => {
          const newZoom = prev + delta;
          return Math.round(Math.min(200, Math.max(30, newZoom)));
        });
      }
    };

    // Touch event handlers (Pinch gesture)
    let workflowInitialDistance = 0;
    let workflowInitialZoom = 100;
    let progressInitialDistance = 0;
    let progressInitialZoom = 100;

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleWorkflowTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        workflowInitialDistance = getDistance(e.touches[0], e.touches[1]);
        workflowInitialZoom = workflowZoom;
      }
    };

    const handleWorkflowTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / workflowInitialDistance;
        const newZoom = workflowInitialZoom * scale;
        setWorkflowZoom(Math.round(Math.min(200, Math.max(30, newZoom))));
      }
    };

    const handleProgressTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        progressInitialDistance = getDistance(e.touches[0], e.touches[1]);
        progressInitialZoom = progressZoom;
      }
    };

    const handleProgressTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / progressInitialDistance;
        const newZoom = progressInitialZoom * scale;
        setProgressZoom(Math.round(Math.min(200, Math.max(30, newZoom))));
      }
    };

    // Add event listeners
    if (workflowContainer) {
      workflowContainer.addEventListener('wheel', handleWorkflowWheel as EventListener, { passive: false });
      workflowContainer.addEventListener('touchstart', handleWorkflowTouchStart as EventListener, { passive: false });
      workflowContainer.addEventListener('touchmove', handleWorkflowTouchMove as EventListener, { passive: false });
    }

    if (progressContainer) {
      progressContainer.addEventListener('wheel', handleProgressWheel as EventListener, { passive: false });
      progressContainer.addEventListener('touchstart', handleProgressTouchStart as EventListener, { passive: false });
      progressContainer.addEventListener('touchmove', handleProgressTouchMove as EventListener, { passive: false });
    }

    // Cleanup
    return () => {
      if (workflowContainer) {
        workflowContainer.removeEventListener('wheel', handleWorkflowWheel as EventListener);
        workflowContainer.removeEventListener('touchstart', handleWorkflowTouchStart as EventListener);
        workflowContainer.removeEventListener('touchmove', handleWorkflowTouchMove as EventListener);
      }
      if (progressContainer) {
        progressContainer.removeEventListener('wheel', handleProgressWheel as EventListener);
        progressContainer.removeEventListener('touchstart', handleProgressTouchStart as EventListener);
        progressContainer.removeEventListener('touchmove', handleProgressTouchMove as EventListener);
      }
    };
  }, [workflowZoom, progressZoom]);

  return {
    workflowZoom,
    setWorkflowZoom,
    progressZoom,
    setProgressZoom,
    compactMode,
    setCompactMode
  };
}
