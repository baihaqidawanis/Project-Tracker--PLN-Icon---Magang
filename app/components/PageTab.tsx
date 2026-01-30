'use client';

import React, { useState, useEffect, useRef, ClipboardEvent } from 'react';
import { Plus, Trash2, CheckCircle, Loader2, GripVertical, ZoomIn, ZoomOut, Maximize, Maximize2, Minimize, Columns } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Select from 'react-select';
import { formatDateShort, formatDateForInput } from '../utils/date-utils';

interface WorkflowRow {
  clientId: string; // For frontend DnD stability
  id?: number;
  type?: 'main' | 'sub';
  no: number | string;
  activity: string;
  bobot: number;
  target: string;
  status: string;
  progress: number;
  sortOrder?: number;
  isNew?: boolean;
  isDirty?: boolean;
}

interface ProgressRow {
  clientId: string; // For frontend DnD stability
  id?: number;
  date: string;
  activityType: string;
  description: string;
  targetIfPlan: string;
  pic: string;
  category: string;
  sortOrder?: number;
  isNew?: boolean;
  isDirty?: boolean;
}

// Sortable Row Component for DnD
interface SortableRowProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

function SortableRow({ id, children, className = '' }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: isDragging ? 'relative' : undefined,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className={className}>
      <td className="px-1 py-1 text-center cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical size={14} className="text-gray-400 hover:text-blue-600 mx-auto" />
      </td>
      {children}
    </tr>
  );
}

// Resize Handle Component for Column Headers
interface ResizeHandleProps {
  table: 'workflow' | 'progress';
  column: string;
  onResizeStart: (e: React.MouseEvent, table: 'workflow' | 'progress', column: string) => void;
}

function ResizeHandle({ table, column, onResizeStart }: ResizeHandleProps) {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 group border-r border-gray-300 dark:border-gray-600"
      onMouseDown={(e) => onResizeStart(e, table, column)}
      title="Drag to resize column"
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
        <svg width="10" height="20" viewBox="0 0 10 20" fill="currentColor" className="text-gray-500 dark:text-gray-400">
          <path d="M2 0h1v20H2V0zm5 0h1v20H7V0z" />
        </svg>
      </div>
    </div>
  );
}


type FullScreenMode = 'none' | 'workflow' | 'progress' | 'both';

type PageTabProps = {
  pages: any[];
  setPages: React.Dispatch<React.SetStateAction<any[]>>;
  workflows: any[];
  setWorkflows: React.Dispatch<React.SetStateAction<any[]>>;
  dailyProgress: any[];
  setDailyProgress: React.Dispatch<React.SetStateAction<any[]>>;
  masterData: any;
  fullScreenMode: FullScreenMode;
  setFullScreenMode: React.Dispatch<React.SetStateAction<FullScreenMode>>;
  onOpenModal: (type: string, data?: any) => void;
  onDelete: (type: string, id: number) => Promise<void>;
};

// DateDisplayInput Component - shows "dd MMM" when not focused, date picker when focused
interface DateDisplayInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onPaste?: (e: ClipboardEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

function DateDisplayInput({ value, onChange, onFocus, onPaste, className, style }: DateDisplayInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  if (isFocused) {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        onPaste={onPaste}
        className={className}
        style={style}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={handleFocus}
      className={className}
      style={{ ...style, cursor: 'pointer' }}
    >
      {value ? formatDateShort(value) : '-'}
    </div>
  );
}

export default function PageTab({
  pages,
  setPages,
  workflows,
  setWorkflows,
  dailyProgress,
  setDailyProgress,
  masterData,
  fullScreenMode,
  setFullScreenMode,
  onOpenModal,
  onDelete
}: PageTabProps) {
  // Constants for localStorage
  const STORAGE_KEY_WORKFLOW_WIDTHS = 'pln_project_tracker_workflow_widths';
  const STORAGE_KEY_PROGRESS_WIDTHS = 'pln_project_tracker_progress_widths';
  const STORAGE_KEY_WORKFLOW_ZOOM = 'pln_workflow_zoom';
  const STORAGE_KEY_PROGRESS_ZOOM = 'pln_progress_zoom';
  const STORAGE_KEY_COMPACT_MODE = 'pln_compact_mode';
  const STORAGE_KEY_FULLSCREEN = 'pln_fullscreen';

  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [previousPagesLength, setPreviousPagesLength] = useState(0);

  // Data States
  const [workflowRows, setWorkflowRows] = useState<WorkflowRow[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);

  // Auto-Save States
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- FILL HANDLE STATES ---
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; field: string; table: 'workflow' | 'progress' } | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [fillSelection, setFillSelection] = useState<{ startRow: number; endRow: number } | null>(null);

  // --- VIEW CONTROL STATES ---
  const [workflowZoom, setWorkflowZoom] = useState(100);
  const [progressZoom, setProgressZoom] = useState(100);
  const [compactMode, setCompactMode] = useState(false);

  // --- COLUMN RESIZE STATES ---
  const [workflowColumnWidths, setWorkflowColumnWidths] = useState<Record<string, number>>({
    no: 64,
    activity: 200,
    bobot: 64,
    target: 96,
    status: 112,
    progress: 80,
  });
  const [progressColumnWidths, setProgressColumnWidths] = useState<Record<string, number>>({
    date: 96,
    activityType: 112,
    description: 200,
    targetIfPlan: 112,
    pic: 80,
    category: 80,
  });
  const [resizingColumn, setResizingColumn] = useState<{ table: 'workflow' | 'progress'; column: string; startX: number; startWidth: number } | null>(null);

  // Ref to track current widths for saving
  const widthsRef = useRef({ workflow: workflowColumnWidths, progress: progressColumnWidths });
  widthsRef.current = { workflow: workflowColumnWidths, progress: progressColumnWidths };

  // Track if component has mounted to prevent saving defaults on initial load
  const hasMountedRef = useRef(false);

  // Load widths from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWorkflow = localStorage.getItem(STORAGE_KEY_WORKFLOW_WIDTHS);
      const savedProgress = localStorage.getItem(STORAGE_KEY_PROGRESS_WIDTHS);
      if (savedWorkflow) {
        try {
          setWorkflowColumnWidths(prev => ({ ...prev, ...JSON.parse(savedWorkflow) }));
        } catch (e) { console.error('Failed to parse saved workflow widths', e); }
      }
      if (savedProgress) {
        try {
          setProgressColumnWidths(prev => ({ ...prev, ...JSON.parse(savedProgress) }));
        } catch (e) { console.error('Failed to parse saved progress widths', e); }
      }

      // Load view control settings
      const savedWorkflowZoom = localStorage.getItem(STORAGE_KEY_WORKFLOW_ZOOM);
      const savedProgressZoom = localStorage.getItem(STORAGE_KEY_PROGRESS_ZOOM);
      const savedCompactMode = localStorage.getItem(STORAGE_KEY_COMPACT_MODE);

      if (savedWorkflowZoom) setWorkflowZoom(parseInt(savedWorkflowZoom));
      if (savedProgressZoom) setProgressZoom(parseInt(savedProgressZoom));
      if (savedCompactMode) setCompactMode(savedCompactMode === 'true');

      // Mark as mounted after loading
      hasMountedRef.current = true;
    }
  }, []);

  // Save widths whenever they change (but not on initial mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && hasMountedRef.current) {
      localStorage.setItem(STORAGE_KEY_WORKFLOW_WIDTHS, JSON.stringify(workflowColumnWidths));
      localStorage.setItem(STORAGE_KEY_PROGRESS_WIDTHS, JSON.stringify(progressColumnWidths));
    }
  }, [workflowColumnWidths, progressColumnWidths]);

  // Save view control settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORKFLOW_ZOOM, workflowZoom.toString());
  }, [workflowZoom]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROGRESS_ZOOM, progressZoom.toString());
  }, [progressZoom]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPACT_MODE, compactMode.toString());
  }, [compactMode]);

  // Wheel and touch event handlers for gesture-based zoom
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

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Logic: If click target is not a cell input, clear activeCell
      // We can use a simple check if the target has specific class or attribute data-cell-input
      const target = e.target as HTMLElement;
      const isCellInput = target.closest('td') !== null; // Rough check, can be more specific if needed
      if (!isCellInput && !isDraggingFill) {
        setActiveCell(null);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingFill && activeCell && fillSelection) {
        // EXECUTE COPY
        const { startRow, endRow } = fillSelection;
        if (startRow !== endRow) {
          if (activeCell.table === 'workflow') {
            // Logic copy inside saveWorkflowFill
            handleWorkflowFill(activeCell, startRow, endRow);
          } else {
            handleProgressFill(activeCell, startRow, endRow);
          }
        }
        setIsDraggingFill(false);
        setFillSelection(null);
      }
      // Handle column resize end
      if (resizingColumn) {
        setResizingColumn(null);
      }
    };

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

    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDraggingFill, activeCell, fillSelection, resizingColumn]);

  // Auto-resize all textareas when data loads
  useEffect(() => {
    const resizeAllTextareas = () => {
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach((textarea) => {
        if (textarea instanceof HTMLTextAreaElement) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      });
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(resizeAllTextareas, 100);
    return () => clearTimeout(timer);
  }, [workflowRows, progressRows]);


  const handleWorkflowFill = (source: { rowIndex: number; field: string }, start: number, end: number) => {
    setWorkflowRows(prev => {
      const newRows = [...prev];
      const sourceValue = newRows[source.rowIndex][source.field as keyof WorkflowRow];

      const min = Math.min(start, end);
      const max = Math.max(start, end);

      for (let i = min; i <= max; i++) {
        if (i === source.rowIndex) continue;
        // Don't overwrite distinct main activities if copying from sub, etc. (basic safety)
        newRows[i] = { ...newRows[i], [source.field]: sourceValue, isDirty: true };

        // Special logic for status -> progress
        if (source.field === 'status' && newRows[i].type === 'sub') {
          if (sourceValue === 'Done') newRows[i].progress = newRows[i].bobot;
          else newRows[i].progress = 0;
        }
      }
      return newRows;
    });
  };

  const handleProgressFill = (source: { rowIndex: number; field: string }, start: number, end: number) => {
    setProgressRows(prev => {
      const newRows = [...prev];
      const sourceValue = newRows[source.rowIndex][source.field as keyof ProgressRow];

      const min = Math.min(start, end);
      const max = Math.max(start, end);

      for (let i = min; i <= max; i++) {
        if (i === source.rowIndex) continue;
        newRows[i] = { ...newRows[i], [source.field]: sourceValue, isDirty: true };
      }
      return newRows;
    });
  };

  const isCellActive = (rowIndex: number, field: string, table: 'workflow' | 'progress') =>
    activeCell?.rowIndex === rowIndex && activeCell?.field === field && activeCell?.table === table;

  const isCellInSelection = (rowIndex: number, field: string, table: 'workflow' | 'progress') => {
    if (!isDraggingFill || !activeCell || !fillSelection || activeCell.table !== table || activeCell.field !== field) return false;
    const min = Math.min(fillSelection.startRow, fillSelection.endRow);
    const max = Math.max(fillSelection.startRow, fillSelection.endRow);
    return rowIndex >= min && rowIndex <= max;
  };

  const handleCellFocus = (rowIndex: number, field: string, table: 'workflow' | 'progress') => {
    if (!isDraggingFill) setActiveCell({ rowIndex, field, table });
  };

  const handleFillMouseDown = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFill(true);
    setFillSelection({ startRow: rowIndex, endRow: rowIndex });
  };

  const handleFillMouseEnter = (rowIndex: number, field: string, table: 'workflow' | 'progress') => {
    if (isDraggingFill && activeCell?.table === table && activeCell.field === field) {
      setFillSelection(prev => prev ? { ...prev, endRow: rowIndex } : null);
    }
  };

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




  // --- DnD SENSORS ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Separate drag handlers for Workflow and Progress
  const handleWorkflowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setWorkflowRows((items) => {
      const oldIndex = items.findIndex((item) => item.clientId === active.id);
      const newIndex = items.findIndex((item) => item.clientId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newRows = arrayMove(items, oldIndex, newIndex);
        return newRows.map((row, index) => ({ ...row, isDirty: true, sortOrder: index }));
      }
      return items;
    });
  };

  const handleProgressDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setProgressRows((items) => {
      const oldIndex = items.findIndex((item) => item.clientId === active.id);
      const newIndex = items.findIndex((item) => item.clientId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newRows = arrayMove(items, oldIndex, newIndex);
        return newRows.map((row, index) => ({ ...row, isDirty: true, sortOrder: index }));
      }
      return items;
    });
  };

  // --- AUTO SAVE LOGIC ---
  const saveDirtyRows = async () => {
    if (!selectedPageId) return;
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

          const res = await fetch('/api/workflows', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          if (res.ok) {
            const savedData = await res.json();
            updatedWorkflows[i] = {
              ...updatedWorkflows[i],
              id: savedData.id || row.id,
              sortOrder: i, // Update sortOrder di state
              isNew: false,
              isDirty: false
            };
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
              sortOrder: i, // Update sortOrder di state
              isNew: false,
              isDirty: false
            };
          }
        }
      }

      if (workflowChanges) setWorkflowRows(updatedWorkflows);
      if (progressChanges) setProgressRows(updatedProgress);

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

    if ((hasDirtyWorkflow || hasDirtyProgress) && selectedPageId) {
      setSaveStatus('saving');

      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

      autoSaveTimerRef.current = setTimeout(() => {
        saveDirtyRows();
      }, 500);
    } else {
      // Jika tidak ada dirty rows, pastikan status 'saved'
      setSaveStatus('saved');
    }

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [workflowRows, progressRows]);


  // --- WORKFLOW HANDLERS ---
  const moveWorkflowRow = (index: number, direction: 'up' | 'down') => {
    setWorkflowRows(prev => {
      const newRows = [...prev];
      if (direction === 'up' && index > 0) {
        [newRows[index], newRows[index - 1]] = [newRows[index - 1], newRows[index]];
      } else if (direction === 'down' && index < newRows.length - 1) {
        [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
      }
      // Mark ALL rows as dirty to update sortOrder for all
      return newRows.map(row => ({ ...row, isDirty: true }));
    });
  };

  const addWorkflowMain = () => {
    if (!selectedPageId) return;
    // Hitung jumlah main row yang sudah ada
    const mainRowCount = workflowRows.filter(row => row.type === 'main').length;
    setWorkflowRows(prev => [
      ...prev,
      {
        clientId: `new-${Date.now()}`,
        type: 'main',
        no: mainRowCount + 1,
        activity: '',
        bobot: 0,
        target: '',
        status: '',
        progress: 0,
        isNew: true,
        isDirty: true
      }
    ]);
  };

  const addWorkflowSub = () => {
    if (!selectedPageId) return;
    setWorkflowRows(prev => [
      ...prev,
      {
        clientId: `new-${Date.now()}`,
        type: 'sub',
        no: '',
        activity: '',
        bobot: 0,
        target: '',
        status: 'Not Started',
        progress: 0,
        isNew: true,
        isDirty: true
      }
    ]);
  };

  const updateWorkflowCell = (index: number, field: keyof WorkflowRow, value: any) => {
    setWorkflowRows(prev => {
      const newRows = [...prev];
      const currentRow = { ...newRows[index], [field]: value, isDirty: true };

      if (currentRow.type === 'sub' && (field === 'status' || field === 'bobot')) {
        const currentStatus = field === 'status' ? value : currentRow.status;
        const currentBobot = field === 'bobot' ? value : currentRow.bobot;

        if (currentStatus === 'Done') {
          currentRow.progress = currentBobot;
        } else {
          currentRow.progress = 0;
        }
      }

      newRows[index] = currentRow;
      return newRows;
    });
  };

  const deleteWorkflowRow = async (index: number) => {
    const row = workflowRows[index];
    if (row.id) {
      await onDelete('workflow', row.id);
    }
    setWorkflowRows(prev => prev.filter((_, i) => i !== index));
  };

  // --- PROGRESS HANDLERS ---
  const moveProgressRow = (index: number, direction: 'up' | 'down') => {
    setProgressRows(prev => {
      const newRows = [...prev];
      if (direction === 'up' && index > 0) {
        [newRows[index], newRows[index - 1]] = [newRows[index - 1], newRows[index]];
      } else if (direction === 'down' && index < newRows.length - 1) {
        [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
      }
      // Mark ALL rows as dirty to update sortOrder for all
      return newRows.map(row => ({ ...row, isDirty: true }));
    });
  };

  const updateProgressCell = (index: number, field: keyof ProgressRow, value: any) => {
    setProgressRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value, isDirty: true };
      return newRows;
    });
  };

  const addProgressRow = () => {
    if (!selectedPageId) return;
    const newRow: ProgressRow = {
      clientId: `new-${Date.now()}`,
      date: '',
      activityType: '',
      description: '',
      targetIfPlan: '',
      pic: '',
      category: '',
      sortOrder: -1, // New rows at top
      isNew: true,
      isDirty: true
    };
    // Add new row at the beginning (index 0)
    setProgressRows(prev => [newRow, ...prev].map((row, index) => ({ ...row, sortOrder: index })));
  };

  const deleteProgressRow = async (index: number) => {
    const row = progressRows[index];
    if (row.id) {
      await onDelete('progress', row.id);
    }
    setProgressRows(prev => prev.filter((_, i) => i !== index));
  };

  // --- PASTE HANDLERS ---
  const handleWorkflowPaste = (e: ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const rows = pastedData.split('\n').map(row => row.split('\t'));
    const fields: (keyof WorkflowRow)[] = ['no', 'activity', 'bobot', 'target', 'status', 'progress'];
    setWorkflowRows(prev => {
      const newRows = [...prev];
      rows.forEach((rowData, rIdx) => {
        const targetRowIndex = rowIndex + rIdx;
        if (targetRowIndex >= newRows.length) {
          newRows.push({ clientId: `new-${Date.now()}-${rIdx}`, type: 'sub', no: '', activity: '', bobot: 0, target: '', status: '', progress: 0, isNew: true, isDirty: true });
        }
        rowData.forEach((cellData, cIdx) => {
          const targetColIndex = colIndex + cIdx;
          if (targetColIndex < fields.length) {
            const field = fields[targetColIndex];
            let value: any = cellData.trim();
            if (field === 'bobot' || field === 'progress') value = parseInt(value) || 0;
            else if (field === 'no') value = value;
            newRows[targetRowIndex] = { ...newRows[targetRowIndex], [field]: value, isDirty: true };
            const updatedRow = newRows[targetRowIndex];
            if (updatedRow.type === 'sub') {
              if (updatedRow.status === 'Done') updatedRow.progress = updatedRow.bobot;
              else updatedRow.progress = 0;
            }
          }
        });
      });
      return newRows;
    });
  };

  const handleProgressPaste = (e: ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const rows = pastedData.split('\n').map(row => row.split('\t'));
    const fields: (keyof ProgressRow)[] = ['date', 'activityType', 'description', 'targetIfPlan', 'pic', 'category'];
    setProgressRows(prev => {
      const newRows = [...prev];
      rows.forEach((rowData, rIdx) => {
        const targetRowIndex = rowIndex + rIdx;
        if (targetRowIndex >= newRows.length) {
          newRows.push({ clientId: `new-${Date.now()}-${rIdx}`, date: '', activityType: '', description: '', targetIfPlan: '', pic: '', category: '', isNew: true, isDirty: true });
        }
        rowData.forEach((cellData, cIdx) => {
          const targetColIndex = colIndex + cIdx;
          if (targetColIndex < fields.length) {
            const field = fields[targetColIndex];
            newRows[targetRowIndex] = { ...newRows[targetRowIndex], [field]: cellData.trim(), isDirty: true };
          }
        });
      });
      return newRows;
    });
  };

  // --- SELECTION & LOAD ---
  useEffect(() => {
    if (Array.isArray(pages) && pages.length > 0 && !selectedPageId) setSelectedPageId(pages[0].id);
    else if (Array.isArray(pages) && pages.length !== previousPagesLength) {
      if (selectedPageId && !pages.find(p => p.id === selectedPageId)) setSelectedPageId(pages.length > 0 ? pages[0].id : null);
      setPreviousPagesLength(pages.length);
    }
  }, [pages, selectedPageId, previousPagesLength]);

  const selectedPage = Array.isArray(pages) ? pages.find(p => p.id === selectedPageId) : undefined;

  useEffect(() => {
    if (selectedPage) {
      // Load workflows tanpa auto-fix (untuk menghindari infinite loop)
      const workflows = selectedPage.workflows?.map((w: any, index: number) => {
        return {
          ...w,
          clientId: w.id ? w.id.toString() : `temp-${index}`,
          type: w.no ? 'main' : 'sub',
          isDirty: false, // Jangan auto-fix
          isNew: false
        };
      }) || [];

      setWorkflowRows(workflows);

      // Load daily progress tanpa auto-fix
      const progress = selectedPage.dailyProgress?.map((p: any, index: number) => {
        return {
          ...p,
          clientId: p.id ? p.id.toString() : `temp-${index}`,
          date: p.date || '',
          isDirty: false, // Jangan auto-fix
          isNew: false
        };
      }) || [];

      setProgressRows(progress);
    } else {
      setWorkflowRows([]);
      setProgressRows([]);
    }
  }, [selectedPage]);

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
  };

  const [pageSearch, setPageSearch] = useState('');

  // Tambahkan helper agar page list bisa dipakai react-select
  const pageOptions = Array.isArray(pages)
    ? pages.map(page => ({
      value: page.id,
      label: `${page.pageNumber} - ${page.partnershipName}`
    }))
    : [];

  return (
    <div>
      {/* Page Selector with react-select */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex-1">
          <Select
            options={pageOptions}
            value={pageOptions.find(opt => opt.value === selectedPageId) || null}
            onChange={opt => setSelectedPageId(opt ? opt.value : null)}
            placeholder="Select or search page..."
            isClearable
            styles={{
              menu: (provided) => ({ ...provided, zIndex: 50 }),
              option: (provided, state) => ({
                ...provided,
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : '#ffffff',
                color: state.isSelected ? '#ffffff' : '#1f2937',
                ':active': {
                  backgroundColor: '#3b82f6',
                }
              }),
              control: (provided) => ({ ...provided, minHeight: 48 }),
              singleValue: (provided) => ({ ...provided, color: '#1f2937' }),
            }}
          />
        </div>
        <button onClick={() => onOpenModal('page')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md">
          <Plus size={16} /> Add New Page
        </button>

        {/* Global Full-Screen Button (Both Tables) */}
        <button
          onClick={() => setFullScreenMode(fullScreenMode === 'both' ? 'none' : 'both')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-colors ${fullScreenMode === 'both'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          title={fullScreenMode === 'both' ? "Exit Full-Screen" : "Full-Screen Both Tables"}
        >
          {fullScreenMode === 'both' ? <Minimize size={16} /> : <Maximize2 size={16} />}
          <span className="hidden sm:inline">{fullScreenMode === 'both' ? 'Exit' : 'Full-Screen'}</span>
        </button>

        {selectedPage && (
          <>
            <button onClick={() => onOpenModal('page', selectedPage)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md">Edit Page</button>
            <button onClick={() => onDelete('page', selectedPage.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"><Trash2 size={16} /> Delete Page</button>
          </>
        )}
      </div>

      {!selectedPage ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No pages available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Partnership</h2>
                <p className="text-3xl font-bold text-white mt-2">{selectedPage.partnershipName}</p>
              </div>
              <div className="flex gap-3">
                {['REKON', 'SUPPORT', 'PARTNERSHIP'].map(b => (
                  <button key={b} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">{b}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* --- WORKFLOW TABLE --- */}
            {fullScreenMode !== 'progress' && (
              <div className={fullScreenMode === 'workflow' ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-auto p-8' : ''}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-blue-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workflow</h3>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Zoom Control */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setWorkflowZoom(Math.max(30, workflowZoom - 10))}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Zoom Out"
                        >
                          <ZoomOut size={18} />
                        </button>
                        <input
                          type="number"
                          value={workflowZoom}
                          onChange={(e) => setWorkflowZoom(Math.min(200, Math.max(30, Number(e.target.value) || 100)))}
                          className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                          min="30"
                          max="200"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                        <button
                          onClick={() => setWorkflowZoom(Math.min(200, workflowZoom + 10))}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Zoom In"
                        >
                          <ZoomIn size={18} />
                        </button>
                      </div>


                      {/* Workflow Full-Screen Toggle */}
                      <button
                        onClick={() => setFullScreenMode(fullScreenMode === 'workflow' ? 'none' : 'workflow')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${fullScreenMode === 'workflow'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        title={fullScreenMode === 'workflow' ? "Exit Workflow Full-Screen" : "Workflow Full-Screen"}
                      >
                        {fullScreenMode === 'workflow' ? <Minimize size={14} /> : <Maximize size={14} />}
                      </button>

                      {/* Save Status */}
                      <div className="flex items-center gap-2">
                        {saveStatus === 'saving' && (
                          <span className="text-xs text-blue-600 font-medium flex items-center gap-1 animate-pulse">
                            <Loader2 size={14} className="animate-spin" /> Saving...
                          </span>
                        )}
                        {saveStatus === 'saved' && (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle size={14} /> All saved
                          </span>
                        )}
                        {saveStatus === 'error' && (
                          <span className="text-xs text-red-600 font-medium">Error saving</span>
                        )}
                      </div>

                      {/* Add Main/Sub Buttons */}
                      <button onClick={addWorkflowMain} className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1">
                        + Main
                      </button>
                      <button onClick={addWorkflowSub} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1">
                        + Sub
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                    <div
                      id="workflow-table-container"
                      style={{
                        zoom: workflowZoom / 100,
                        minWidth: 'max-content'
                      }}
                    >
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleWorkflowDragEnd}
                      >
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                            <tr>
                              <th className={compactMode ? "px-1 py-1 w-8" : "px-1 py-2 w-8"}></th>
                              <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.no }}>
                                No
                                <ResizeHandle table="workflow" column="no" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.activity }}>
                                Activity
                                <ResizeHandle table="workflow" column="activity" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.bobot }}>
                                Bobot%
                                <ResizeHandle table="workflow" column="bobot" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.target }}>
                                Target
                                <ResizeHandle table="workflow" column="target" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.status }}>
                                Status
                                <ResizeHandle table="workflow" column="status" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.progress }}>
                                Progress%
                                <ResizeHandle table="workflow" column="progress" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className={compactMode ? "px-1 py-1 text-center w-8" : "px-1 py-1 text-center w-8"}></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" style={{ fontSize: compactMode ? 9 : 10 }}>
                            <SortableContext
                              items={workflowRows.map(r => r.clientId)}
                              strategy={verticalListSortingStrategy}
                            >
                              {workflowRows.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No workflows yet.</td></tr>
                              ) : (
                                workflowRows.map((row, rowIdx) => (
                                  <SortableRow
                                    key={row.clientId}
                                    id={row.clientId}
                                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${row.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                                  >
                                    <td className="px-2 py-1" style={{ width: workflowColumnWidths.no, wordWrap: 'break-word' }}>
                                      {row.type === 'main' ? (
                                        <div className={`relative w-full ${isCellInSelection(rowIdx, 'no', 'workflow') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                          onMouseEnter={() => handleFillMouseEnter(rowIdx, 'no', 'workflow')}>
                                          <input type="text" value={row.no}
                                            onFocus={() => handleCellFocus(rowIdx, 'no', 'workflow')}
                                            onChange={(e) => updateWorkflowCell(rowIdx, 'no', e.target.value)}
                                            className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded font-bold"
                                            style={{ fontSize: 10 }}
                                          />
                                          {isCellActive(rowIdx, 'no', 'workflow') && !isDraggingFill && (
                                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                          )}
                                        </div>
                                      ) : null}
                                    </td>

                                    <td className="px-2 py-1 relative" style={{ width: workflowColumnWidths.activity, wordWrap: 'break-word' }}>
                                      <div className={`relative w-full ${isCellInSelection(rowIdx, 'activity', 'workflow') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                        onMouseEnter={() => handleFillMouseEnter(rowIdx, 'activity', 'workflow')}>
                                        <textarea
                                          value={row.activity}
                                          onFocus={() => handleCellFocus(rowIdx, 'activity', 'workflow')}
                                          onChange={(e) => updateWorkflowCell(rowIdx, 'activity', e.target.value)}
                                          onPaste={(e) => {
                                            e.preventDefault();
                                            const pastedData = e.clipboardData.getData('text');
                                            const normalized = pastedData.replace(/\r\n|\r/g, '\n');
                                            updateWorkflowCell(rowIdx, 'activity', normalized);
                                          }}
                                          className={`w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded resize-none overflow-hidden ${row.type === 'main' ? 'font-bold' : ''}`}
                                          style={{ fontSize: 10 }}
                                          rows={1} onInput={autoResize}
                                          placeholder={row.type === 'main' ? "Main Activity" : "Sub Activity"}
                                        />
                                        {isCellActive(rowIdx, 'activity', 'workflow') && !isDraggingFill && (
                                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                        )}
                                      </div>
                                    </td>

                                    <td className="px-2 py-1" style={{ width: workflowColumnWidths.bobot, wordWrap: 'break-word' }}>
                                      {row.type === 'sub' && (
                                        <div className={`relative w-full ${isCellInSelection(rowIdx, 'bobot', 'workflow') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                          onMouseEnter={() => handleFillMouseEnter(rowIdx, 'bobot', 'workflow')}>
                                          <input type="number" value={row.bobot}
                                            onFocus={() => handleCellFocus(rowIdx, 'bobot', 'workflow')}
                                            onChange={(e) => updateWorkflowCell(rowIdx, 'bobot', parseInt(e.target.value) || 0)}
                                            onPaste={(e) => handleWorkflowPaste(e, rowIdx, 2)}
                                            className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded"
                                            style={{ fontSize: 10 }}
                                          />
                                          {isCellActive(rowIdx, 'bobot', 'workflow') && !isDraggingFill && (
                                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-2 py-1" style={{ width: workflowColumnWidths.target, wordWrap: 'break-word' }}>
                                      {row.type === 'sub' && (
                                        <div className={`relative w-full ${isCellInSelection(rowIdx, 'target', 'workflow') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                          onMouseEnter={() => handleFillMouseEnter(rowIdx, 'target', 'workflow')}>
                                          <textarea value={row.target}
                                            onFocus={() => handleCellFocus(rowIdx, 'target', 'workflow')}
                                            onChange={(e) => updateWorkflowCell(rowIdx, 'target', e.target.value)}
                                            onPaste={(e) => handleWorkflowPaste(e, rowIdx, 3)}
                                            className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded resize-none overflow-hidden"
                                            style={{ fontSize: 10 }}
                                            rows={1} onInput={autoResize}
                                          />
                                          {isCellActive(rowIdx, 'target', 'workflow') && !isDraggingFill && (
                                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-2 py-2" style={{ width: workflowColumnWidths.status, wordWrap: 'break-word' }}>
                                      {row.type === 'sub' && (
                                        <div className={`relative w-full ${isCellInSelection(rowIdx, 'status', 'workflow') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                          onMouseEnter={() => handleFillMouseEnter(rowIdx, 'status', 'workflow')}>
                                          <select value={row.status}
                                            onFocus={() => handleCellFocus(rowIdx, 'status', 'workflow')}
                                            onChange={(e) => updateWorkflowCell(rowIdx, 'status', e.target.value)}
                                            className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded whitespace-normal [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-gray-100 dark:[&>option]:bg-gray-800 [&>option]:whitespace-normal [&>option]:py-2"
                                            style={{ fontSize: 10, whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', minHeight: 28, height: 'auto' }}
                                          >
                                            <option value="">-</option>
                                            <option value="Not Started" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', fontSize: 12 }}>Not Started</option>
                                            <option value="On Progress" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', fontSize: 12 }}>On Progress</option>
                                            <option value="Done" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', fontSize: 12 }}>Done</option>
                                          </select>
                                          {isCellActive(rowIdx, 'status', 'workflow') && !isDraggingFill && (
                                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                          )}
                                        </div>
                                      )}
                                    </td>

                                    <td className="px-2 py-1" style={{ width: workflowColumnWidths.progress, wordWrap: 'break-word' }}>
                                      {row.type === 'sub' && (
                                        <input
                                          type="number" value={row.progress} readOnly
                                          className="w-full px-2 py-1 bg-transparent border-0 focus:ring-0 text-gray-500 dark:text-white cursor-not-allowed"
                                          style={{ fontSize: 10 }}
                                        />
                                      )}
                                    </td>

                                    <td className="px-1 py-1 text-center">
                                      <button onClick={() => deleteWorkflowRow(rowIdx)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                    </td>
                                  </SortableRow>
                                ))
                              )}
                            </SortableContext>
                          </tbody>
                          <tfoot className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                            <tr>
                              <td colSpan={3} className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">TOTAL</td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white text-left">
                                {workflowRows.filter(r => r.type === 'sub').reduce((sum, row) => sum + (row.bobot || 0), 0)}%
                              </td>
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white text-left pl-3">
                                {workflowRows.filter(r => r.type === 'sub').reduce((sum, row) => sum + (row.progress || 0), 0)}%
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </DndContext>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* --- DAILY PROGRESS TABLE --- */}
            {fullScreenMode !== 'workflow' && (
              <div className={fullScreenMode === 'progress' ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-auto p-8' : ''}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-blue-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Progress</h3>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Zoom Control */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setProgressZoom(Math.max(30, progressZoom - 10))}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Zoom Out"
                        >
                          <ZoomOut size={18} />
                        </button>
                        <input
                          type="number"
                          value={progressZoom}
                          onChange={(e) => setProgressZoom(Math.min(200, Math.max(30, Number(e.target.value) || 100)))}
                          className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                          min="30"
                          max="200"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                        <button
                          onClick={() => setProgressZoom(Math.min(200, progressZoom + 10))}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Zoom In"
                        >
                          <ZoomIn size={18} />
                        </button>
                      </div>


                      {/* Daily Progress Full-Screen Toggle */}
                      <button
                        onClick={() => setFullScreenMode(fullScreenMode === 'progress' ? 'none' : 'progress')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${fullScreenMode === 'progress'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        title={fullScreenMode === 'progress' ? "Exit Daily Progress Full-Screen" : "Daily Progress Full-Screen"}
                      >
                        {fullScreenMode === 'progress' ? <Minimize size={14} /> : <Maximize size={14} />}
                      </button>

                      {/* Add Row Button */}
                      <button onClick={addProgressRow} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1">
                        <Plus size={14} /> Add Row
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                    <div
                      id="progress-table-container"
                      style={{
                        zoom: progressZoom / 100,
                        minWidth: 'max-content'
                      }}
                    >
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleProgressDragEnd}
                      >
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                            <tr>
                              <th className="px-1 py-2 w-8"></th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.date }}>
                                Date
                                <ResizeHandle table="progress" column="date" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.activityType }}>
                                Type
                                <ResizeHandle table="progress" column="activityType" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.description }}>
                                Description
                                <ResizeHandle table="progress" column="description" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.targetIfPlan }}>
                                <div>
                                  Target
                                  <div className="text-[9px] text-gray-500 dark:text-gray-400 font-normal">(if plan)</div>
                                </div>
                                <ResizeHandle table="progress" column="targetIfPlan" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.pic }}>
                                PIC
                                <ResizeHandle table="progress" column="pic" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 relative" style={{ width: progressColumnWidths.category }}>
                                Cat 1
                                <ResizeHandle table="progress" column="category" onResizeStart={handleColumnResizeStart} />
                              </th>
                              <th className="px-1 py-1 text-center w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" style={{ fontSize: 10 }}>
                            <SortableContext
                              items={progressRows.map(r => r.clientId)}
                              strategy={verticalListSortingStrategy}
                            >
                              {progressRows.map((row, rowIdx) => {
                                // Logic Cat 1 otomatis
                                let cat1 = '';
                                if (!row.activityType) cat1 = '';
                                else if (row.activityType === 'Meeting Update' || row.activityType === 'Action Update') cat1 = 'Update';
                                else cat1 = 'Plan';
                                return (
                                  <SortableRow
                                    key={row.clientId}
                                    id={row.clientId}
                                    className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${row.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                                  >
                                    <td className="px-2 py-1" style={{ width: progressColumnWidths.date, wordWrap: 'break-word' }}>
                                      <div className={`relative w-full ${isCellInSelection(rowIdx, 'date', 'progress') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                        onMouseEnter={() => handleFillMouseEnter(rowIdx, 'date', 'progress')}>
                                        <DateDisplayInput
                                          value={row.date}
                                          onChange={(value) => updateProgressCell(rowIdx, 'date', value)}
                                          onFocus={() => handleCellFocus(rowIdx, 'date', 'progress')}
                                          onPaste={(e) => handleProgressPaste(e, rowIdx, 0)}
                                          className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                                          style={{ fontSize: 10 }}
                                        />
                                        {isCellActive(rowIdx, 'date', 'progress') && !isDraggingFill && (
                                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1 relative" style={{ width: progressColumnWidths.activityType, wordWrap: 'break-word' }}>
                                      <div className={`relative w-full ${isCellInSelection(rowIdx, 'activityType', 'progress') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                        onMouseEnter={() => handleFillMouseEnter(rowIdx, 'activityType', 'progress')}>
                                        <select
                                          value={row.activityType || ''}
                                          onFocus={() => handleCellFocus(rowIdx, 'activityType', 'progress')}
                                          onChange={e => updateProgressCell(rowIdx, 'activityType', e.target.value)}
                                          className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded whitespace-normal [&>option]:text-gray-900 [&>option]:bg-white dark:[&>option]:text-gray-100 dark:[&>option]:bg-gray-800 [&>option]:whitespace-normal [&>option]:py-2"
                                          style={{ fontSize: 10, whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', minHeight: 28, height: 'auto' }}
                                        >
                                          <option value="">-</option>
                                          {masterData.activityTypes?.map((a: any) => (
                                            <option key={a.name} value={a.name} style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{a.name}</option>
                                          ))}
                                        </select>
                                        {isCellActive(rowIdx, 'activityType', 'progress') && !isDraggingFill && (
                                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1" style={{ width: progressColumnWidths.description, wordWrap: 'break-word' }}>
                                      <div className={`relative w-full ${isCellInSelection(rowIdx, 'description', 'progress') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                        onMouseEnter={() => handleFillMouseEnter(rowIdx, 'description', 'progress')}>
                                        <textarea
                                          value={row.description}
                                          onFocus={() => handleCellFocus(rowIdx, 'description', 'progress')}
                                          onChange={(e) => updateProgressCell(rowIdx, 'description', e.target.value)}
                                          onPaste={(e) => {
                                            e.preventDefault();
                                            const pastedData = e.clipboardData.getData('text');
                                            const normalized = pastedData.replace(/\r\n|\r/g, '\n');
                                            updateProgressCell(rowIdx, 'description', normalized);
                                          }}
                                          className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded resize-none overflow-hidden"
                                          style={{ fontSize: 10 }}
                                          rows={1} onInput={autoResize}
                                        />
                                        {isCellActive(rowIdx, 'description', 'progress') && !isDraggingFill && (
                                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1" style={{ width: progressColumnWidths.targetIfPlan, wordWrap: 'break-word' }}>
                                      <div className={`relative w-full ${isCellInSelection(rowIdx, 'targetIfPlan', 'progress') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                        onMouseEnter={() => handleFillMouseEnter(rowIdx, 'targetIfPlan', 'progress')}>
                                        <DateDisplayInput
                                          value={row.targetIfPlan}
                                          onChange={(value) => updateProgressCell(rowIdx, 'targetIfPlan', value)}
                                          onFocus={() => handleCellFocus(rowIdx, 'targetIfPlan', 'progress')}
                                          onPaste={(e) => handleProgressPaste(e, rowIdx, 3)}
                                          className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                                          style={{ fontSize: 10 }}
                                        />
                                        {isCellActive(rowIdx, 'targetIfPlan', 'progress') && !isDraggingFill && (
                                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1" style={{ width: progressColumnWidths.pic, wordWrap: 'break-word' }}>
                                      <div className={`relative w-full ${isCellInSelection(rowIdx, 'pic', 'progress') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                        onMouseEnter={() => handleFillMouseEnter(rowIdx, 'pic', 'progress')}>
                                        <textarea value={row.pic}
                                          onFocus={() => handleCellFocus(rowIdx, 'pic', 'progress')}
                                          onChange={(e) => updateProgressCell(rowIdx, 'pic', e.target.value)}
                                          onPaste={(e) => handleProgressPaste(e, rowIdx, 4)}
                                          className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded resize-none overflow-hidden"
                                          style={{ fontSize: 10 }}
                                          rows={1}
                                          onInput={autoResize}
                                        />
                                        {isCellActive(rowIdx, 'pic', 'progress') && !isDraggingFill && (
                                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, rowIdx)} />
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1" style={{ width: progressColumnWidths.category, wordWrap: 'break-word' }}>
                                      <input
                                        type="text"
                                        value={cat1 || '-'}
                                        readOnly
                                        className={`w-full px-2 py-1 text-xs bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded font-semibold cursor-not-allowed break-words ${cat1 === 'Update' ? 'text-green-600 dark:text-green-400' : cat1 === 'Plan' ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
                                        style={{ fontSize: 11, wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                                        tabIndex={-1}
                                      />
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                      <button onClick={() => deleteProgressRow(rowIdx)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                    </td>
                                  </SortableRow>
                                );
                              })}
                            </SortableContext>
                          </tbody>
                        </table>
                      </DndContext>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}