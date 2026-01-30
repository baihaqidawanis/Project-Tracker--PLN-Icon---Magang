'use client';

import React, { useState, useEffect, useRef, ClipboardEvent } from 'react';
import { Plus, Trash2, GripVertical, ZoomIn, ZoomOut, Maximize2, Minimize2, CheckCircle, Loader2 } from 'lucide-react';
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

// Helper functions for date formatting (add these if not in utils)
const formatDateShort = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
};

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

interface PartnershipRow {
  clientId: string;
  id?: number;
  code: string;
  kode: string;
  branchId: number | string;
  namaCalonMitra: string;
  prioritasId: number | string;
  picId: number | string;
  jenisKerjaSama: string;
  progressPercentage: number;
  latestDateUpdated: string;
  latestUpdate: string;
  actionPlan: string;
  targetDate: string;
  linkDokumen: string;
  latestActivity: string;
  latestActivityStatusId: number | string;
  sortOrder?: number;
  isNew?: boolean;
  isDirty?: boolean;
  // Populated fields for display
  branch?: any;
  prioritas?: any;
  pic?: any;
  latestActivityStatus?: any;
}

interface PartnershipTabProps {
  projects: any[];
  masterData: any;
  loading: boolean;
  onOpenModal: (type: string, item?: any) => void;
  onDelete: (type: string, id: number) => void;
  pages: any[];
  workflows: any[];
  dailyProgress: any[];
}

// Sortable Row Component
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

// Resize Handle Component
interface ResizeHandleProps {
  column: string;
  onResizeStart: (e: React.MouseEvent, column: string) => void;
}

function ResizeHandle({ column, onResizeStart }: ResizeHandleProps) {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 group border-r border-gray-300 dark:border-gray-600"
      onMouseDown={(e) => onResizeStart(e, column)}
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

export default function PartnershipTab({
  projects,
  masterData,
  loading,
  onOpenModal,
  onDelete,
  pages,
  workflows,
  dailyProgress,
}: PartnershipTabProps) {
  const STORAGE_KEY_WIDTHS = 'pln_partnership_widths';
  const STORAGE_KEY_ZOOM = 'pln_partnership_zoom';

  const [rows, setRows] = useState<PartnershipRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(100);
  const [zoomInput, setZoomInput] = useState('100');
  const [fullScreen, setFullScreen] = useState(false);

  // Fill handle states
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [fillSelection, setFillSelection] = useState<{ startRow: number; endRow: number } | null>(null);

  // Column widths
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    code: 80,
    kode: 100,
    branch: 120,
    namaCalonMitra: 200,
    prioritas: 100,
    pic: 100,
    jenisKerjaSama: 180,
    progressPercentage: 80,
    latestDateUpdated: 100,
    latestUpdate: 200,
    actionPlan: 200,
    targetDate: 100,
    linkDokumen: 150,
    latestActivity: 180,
    latestActivityStatus: 120,
  });
  const [resizingColumn, setResizingColumn] = useState<{ column: string; startX: number; startWidth: number } | null>(null);

  const widthsRef = useRef(columnWidths);
  widthsRef.current = columnWidths;

  // Track if component has mounted
  const hasMountedRef = useRef(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidths = localStorage.getItem(STORAGE_KEY_WIDTHS);
      const savedZoom = localStorage.getItem(STORAGE_KEY_ZOOM);

      if (savedWidths) {
        try {
          setColumnWidths(prev => ({ ...prev, ...JSON.parse(savedWidths) }));
        } catch (e) {
          console.error('Failed to parse saved widths', e);
        }
      }
      if (savedZoom) {
        const parsedZoom = parseInt(savedZoom);
        if (!isNaN(parsedZoom)) {
          setZoom(parsedZoom);
        }
      }

      // Mark as mounted
      hasMountedRef.current = true;
    }
  }, []);

  // Save widths whenever they change (but not on initial mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && hasMountedRef.current) {
      localStorage.setItem(STORAGE_KEY_WIDTHS, JSON.stringify(columnWidths));
    }
  }, [columnWidths]);

  // Save zoom
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ZOOM, zoom.toString());
      setZoomInput(zoom.toString());
    }
  }, [zoom]);

  // ===== AUTO-CALCULATION FUNCTIONS =====

  // Calculate % Progress from workflows
  // Calculate % Progress: Sum of all SUB workflow progress / 2
  const calculateProgress = (code: string): number => {
    if (!code || !pages || !workflows) return 0;
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return 0;

    const pageWorkflows = workflows.filter(w => w.pageId === page.id && w.type === 'sub');
    if (pageWorkflows.length === 0) return 0;

    const totalProgress = pageWorkflows.reduce((sum, w) => sum + (w.progress || 0), 0);
    // User requested "sum entire column progress... or sum all then / 2". 
    // Implementing sum all then / 2.
    return Math.round(totalProgress / 2);
  };

  // Helper to categorize daily progress
  const getCategory = (activityType: string) => {
    if (!activityType) return '';
    if (activityType === 'Meeting Update' || activityType === 'Action Update') return 'Update';
    return 'Plan';
  };

  // Latest Date Updated & Latest Update (Category = Update)
  const getLatestUpdateData = (code: string) => {
    if (!code || !pages || !dailyProgress) return { date: '', description: '' };
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return { date: '', description: '' };

    const updates = dailyProgress
      .filter(dp => dp.pageId === page.id && getCategory(dp.activityType) === 'Update')
      // Sort by date descending
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    if (updates.length === 0) return { date: '', description: '' };
    return {
      date: updates[0].date ? formatDateForInput(updates[0].date) : '',
      description: updates[0].description || ''
    };
  };

  // Action Plan & Target (Category = Plan)
  const getPlanData = (code: string) => {
    if (!code || !pages || !dailyProgress) return { actionPlan: '', target: '' };
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return { actionPlan: '', target: '' };

    const plans = dailyProgress
      .filter(dp => dp.pageId === page.id && getCategory(dp.activityType) === 'Plan')
      // Sort by date descending (latest Plan)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    if (plans.length === 0) return { actionPlan: '', target: '' };
    return {
      actionPlan: plans[0].description || '',
      target: plans[0].targetIfPlan || ''
    };
  };

  // Latest Activity & Status (Hierarchy: On Progress > Not Started > Done, Bottom-up)
  const getActivityData = (code: string) => {
    if (!code || !pages || !workflows) return { activity: '', statusId: '' };
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return { activity: '', statusId: '' };

    // Get workflows for this page, sort by sortOrder descending (bottom-up)
    const pageWorkflows = workflows
      .filter(w => w.pageId === page.id)
      .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));

    // 1. Find "On Progress"
    const onProgress = pageWorkflows.find(w => w.status?.toLowerCase() === 'on progress');
    if (onProgress) {
      const statusId = masterData?.statuses?.find((s: any) => s.name?.toLowerCase() === 'on progress')?.id;
      return { activity: onProgress.activity, statusId: statusId || '' };
    }

    // 2. Find "Not Started"
    const notStarted = pageWorkflows.find(w => w.status?.toLowerCase() === 'not started');
    if (notStarted) {
      const statusId = masterData?.statuses?.find((s: any) => s.name?.toLowerCase() === 'not started')?.id;
      return { activity: notStarted.activity, statusId: statusId || '' };
    }

    // 3. Find "Done"
    const done = pageWorkflows.find(w => w.status?.toLowerCase() === 'done');
    if (done) {
      const statusId = masterData?.statuses?.find((s: any) => s.name?.toLowerCase() === 'done')?.id;
      return { activity: done.activity, statusId: statusId || '' };
    }

    return { activity: '', statusId: '' };
  };

  // Load data into editable state with auto-calculations
  useEffect(() => {
    if (!projects || !Array.isArray(projects)) {
      setRows([]);
      return;
    }

    const partnershipRows = projects.map((p, index) => {
      const code = p.code || '';
      const updateData = getLatestUpdateData(code);
      const planData = getPlanData(code);
      const activityData = getActivityData(code);

      return {
        ...p,
        clientId: p.id ? p.id.toString() : `temp-${index}`,
        code: code,
        // Ensure dropdown values are IDs or strings as needed
        branchId: p.branchId || '',
        prioritasId: p.prioritasId || '',
        picId: p.picId || '',

        // Auto-calculated fields
        progressPercentage: calculateProgress(code),
        latestDateUpdated: updateData.date,
        latestUpdate: updateData.description,
        actionPlan: planData.actionPlan,
        targetDate: planData.target,
        latestActivity: activityData.activity,
        latestActivityStatusId: activityData.statusId,

        // Other fields
        kode: p.kode || '',
        namaCalonMitra: p.namaCalonMitra || '', // Auto from Page ideally, but here we read from DB or sync
        jenisKerjaSama: p.jenisKerjaSama || '',
        linkDokumen: p.linkDokumen || '',
        sortOrder: p.sortOrder !== undefined ? p.sortOrder : index,
        isDirty: false,
        isNew: false,
      };
    });

    // Sort by sortOrder (user's manual order)
    const sorted = partnershipRows.sort((a, b) => {
      // Prioritize rows with sortOrder
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      // If only one has sortOrder, put it first
      if (a.sortOrder !== undefined) return -1;
      if (b.sortOrder !== undefined) return 1;

      // Fallback: sort by code numerically (P.01, P.02, P.03, etc.)
      const extractNumber = (code: string) => {
        const match = code.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };

      return extractNumber(a.code) - extractNumber(b.code);
    });

    setRows(sorted);
  }, [projects, pages, workflows, dailyProgress, masterData]);

  // Global event handlers
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isCellInput = target.closest('td') !== null;
      if (!isCellInput && !isDraggingFill) {
        setActiveCell(null);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingFill && activeCell && fillSelection) {
        const { startRow, endRow } = fillSelection;
        if (startRow !== endRow) {
          handleFill(activeCell, startRow, endRow);
        }
        setIsDraggingFill(false);
        setFillSelection(null);
      }
      if (resizingColumn) {
        setResizingColumn(null);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const delta = e.clientX - resizingColumn.startX;
        const newWidth = Math.max(40, resizingColumn.startWidth + delta);
        setColumnWidths(prev => ({
          ...prev,
          [resizingColumn.column]: newWidth
        }));
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRows((items) => {
      const oldIndex = items.findIndex((item) => item.clientId === active.id);
      const newIndex = items.findIndex((item) => item.clientId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newRows = arrayMove(items, oldIndex, newIndex);
        return newRows.map((row, index) => ({ ...row, isDirty: true, sortOrder: index }));
      }
      return items;
    });
  };

  const updateCell = (index: number, field: keyof PartnershipRow, value: any) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value, isDirty: true };
      return newRows;
    });
  };

  // Auto-save effect
  useEffect(() => {
    const hasDirtyRows = rows.some(row => row.isDirty);
    if (hasDirtyRows) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      // Set new timer (1 second debounce)
      autoSaveTimerRef.current = setTimeout(() => {
        saveDirtyRows();
      }, 1000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [rows]);

  const addRow = () => {
    const newRow: PartnershipRow = {
      clientId: `new-${Date.now()}`,
      code: '',
      kode: '',
      branchId: '',
      namaCalonMitra: '',
      prioritasId: '',
      picId: '',
      jenisKerjaSama: '',
      progressPercentage: 0,
      latestDateUpdated: '',
      latestUpdate: '',
      actionPlan: '',
      targetDate: '',
      linkDokumen: '',
      latestActivity: '',
      latestActivityStatusId: '',
      sortOrder: rows.length,
      isNew: true,
      isDirty: true,
    };
    setRows(prev => [...prev, newRow]);
  };

  const deleteRow = async (index: number) => {
    const row = rows[index];
    if (row.id) {
      await onDelete('project', row.id);
    }
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedRows = pastedData.split('\n').map(row => row.split('\t'));

    const fields: (keyof PartnershipRow)[] = [
      'code', 'kode', 'branchId', 'namaCalonMitra', 'prioritasId', 'picId',
      'jenisKerjaSama', 'progressPercentage', 'latestDateUpdated', 'latestUpdate',
      'actionPlan', 'targetDate', 'linkDokumen', 'latestActivity', 'latestActivityStatusId'
    ];

    setRows(prev => {
      const newRows = [...prev];
      pastedRows.forEach((rowData, rIdx) => {
        const targetRowIndex = rowIndex + rIdx;
        if (targetRowIndex >= newRows.length) {
          newRows.push({
            clientId: `new-${Date.now()}-${rIdx}`,
            code: '',
            kode: '',
            branchId: '',
            namaCalonMitra: '',
            prioritasId: '',
            picId: '',
            jenisKerjaSama: '',
            progressPercentage: 0,
            latestDateUpdated: '',
            latestUpdate: '',
            actionPlan: '',
            targetDate: '',
            linkDokumen: '',
            latestActivity: '',
            latestActivityStatusId: '',
            isNew: true,
            isDirty: true,
          });
        }

        rowData.forEach((cellData, cIdx) => {
          const targetColIndex = colIndex + cIdx;
          if (targetColIndex < fields.length) {
            const field = fields[targetColIndex];
            let value: any = cellData.trim();

            if (field === 'progressPercentage') {
              value = parseInt(value) || 0;
            }

            newRows[targetRowIndex] = {
              ...newRows[targetRowIndex],
              [field]: value,
              isDirty: true
            };
          }
        });
      });
      return newRows;
    });
  };

  const handleFill = (source: { rowIndex: number; field: string }, start: number, end: number) => {
    setRows(prev => {
      const newRows = [...prev];
      const sourceValue = newRows[source.rowIndex][source.field as keyof PartnershipRow];

      const min = Math.min(start, end);
      const max = Math.max(start, end);

      for (let i = min; i <= max; i++) {
        if (i === source.rowIndex) continue;
        newRows[i] = { ...newRows[i], [source.field]: sourceValue, isDirty: true };
      }
      return newRows;
    });
  };

  const isCellActive = (rowIndex: number, field: string) =>
    activeCell?.rowIndex === rowIndex && activeCell?.field === field;

  const isCellInSelection = (rowIndex: number, field: string) => {
    if (!isDraggingFill || !activeCell || !fillSelection || activeCell.field !== field) return false;
    const min = Math.min(fillSelection.startRow, fillSelection.endRow);
    const max = Math.max(fillSelection.startRow, fillSelection.endRow);
    return rowIndex >= min && rowIndex <= max;
  };

  const handleCellFocus = (rowIndex: number, field: string) => {
    if (!isDraggingFill) setActiveCell({ rowIndex, field });
  };

  const handleFillMouseDown = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFill(true);
    setFillSelection({ startRow: rowIndex, endRow: rowIndex });
  };

  const handleFillMouseEnter = (rowIndex: number, field: string) => {
    if (isDraggingFill && activeCell?.field === field) {
      setFillSelection(prev => prev ? { ...prev, endRow: rowIndex } : null);
    }
  };

  const handleColumnResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column]
    });
  };

  // Auto-save function (optimized with parallel requests)
  const saveDirtyRows = async () => {
    setSaveStatus('saving');
    try {
      const updatedRows = [...rows];
      const dirtyRows = updatedRows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.isDirty);

      if (dirtyRows.length === 0) {
        setSaveStatus('saved');
        return;
      }

      // Save all dirty rows in parallel
      const savePromises = dirtyRows.map(async ({ row, index }) => {
        const method = row.isNew ? 'POST' : 'PUT';
        const url = row.isNew ? '/api/projects' : `/api/projects/${row.id}`;

        // Properly extract IDs from objects or use existing values
        const branchId = typeof row.branchId === 'object' && row.branchId !== null
          ? (row.branchId as any).id
          : row.branchId;
        const prioritasId = typeof row.prioritasId === 'object' && row.prioritasId !== null
          ? (row.prioritasId as any).id
          : row.prioritasId;
        const picId = typeof row.picId === 'object' && row.picId !== null
          ? (row.picId as any).id
          : row.picId;
        const latestActivityStatusId = typeof row.latestActivityStatusId === 'object' && row.latestActivityStatusId !== null
          ? (row.latestActivityStatusId as any).id
          : row.latestActivityStatusId;

        // Prepare clean data with proper types
        const payload = {
          code: row.code || '',
          kode: row.kode || '', // Added missing field
          branchId: branchId ? parseInt(String(branchId)) : 0,
          namaCalonMitra: row.namaCalonMitra || '',
          prioritasId: prioritasId ? parseInt(String(prioritasId)) : 0,
          picId: picId ? parseInt(String(picId)) : 0,
          jenisKerjaSama: row.jenisKerjaSama || '',
          progressPercentage: parseInt(String(row.progressPercentage)) || 0,
          latestUpdate: row.latestUpdate || '',
          actionPlan: row.actionPlan || '',
          targetDate: row.targetDate || null,
          linkDokumen: row.linkDokumen || '',
          latestActivity: row.latestActivity || '',
          latestActivityStatusId: latestActivityStatusId ? parseInt(String(latestActivityStatusId)) : null,
          sortOrder: index
        };

        try {
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const savedData = await res.json();
            return { index, savedData, success: true };
          } else {
            const errorText = await res.text();
            console.error(`Failed to save row ${index}:`, res.status, errorText);
            return { index, success: false, error: errorText };
          }
        } catch (err) {
          console.error(`Error saving row ${index}:`, err);
          return { index, success: false, error: String(err) };
        }
      });

      const results = await Promise.all(savePromises);

      // Update rows with saved data
      results.forEach(result => {
        if (result.success && result.savedData) {
          updatedRows[result.index] = {
            ...updatedRows[result.index],
            id: result.savedData.id || updatedRows[result.index].id,
            sortOrder: result.index,
            isDirty: false,
            isNew: false
          };
        }
      });

      const allSuccess = results.every(r => r.success);
      setRows(updatedRows);
      setSaveStatus(allSuccess ? 'saved' : 'error');

    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
    }
  };

  // Manual save (for backward compatibility)
  const saveAllChanges = async () => {
    setSaving(true);
    await saveDirtyRows();
    setSaving(false);
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.round(Math.min(200, Math.max(30, newZoom)));
    setZoom(clampedZoom);
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setZoomInput(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      handleZoomChange(numValue);
    }
  };

  const filteredRows = rows.filter(row =>
    row.namaCalonMitra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
  };

  return (
    <div className={fullScreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-auto' : ''}>
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search partnerships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoomChange(zoom - 10)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <input
              type="number"
              value={zoomInput}
              onChange={handleZoomInputChange}
              className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              min="30"
              max="200"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
            <button
              onClick={() => handleZoomChange(zoom + 10)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setFullScreen(!fullScreen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title={fullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {fullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Auto-save Status */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                <Loader2 size={14} className="animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <CheckCircle size={14} /> All saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Error saving</span>
            )}
          </div>

          <button
            onClick={addRow}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Add Row
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-auto" style={{ maxHeight: '600px' }}>
          <div style={{
            zoom: zoom / 100,
            minWidth: 'max-content'
          }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: 'max-content' }}>
                <thead className="bg-blue-50 dark:bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="px-1 py-2 w-8"></th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.code }}>
                      Code
                      <ResizeHandle column="code" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.kode }}>
                      Kode
                      <ResizeHandle column="kode" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.branch }}>
                      Branch
                      <ResizeHandle column="branch" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.namaCalonMitra }}>
                      Nama Calon Mitra
                      <ResizeHandle column="namaCalonMitra" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.prioritas }}>
                      Prioritas
                      <ResizeHandle column="prioritas" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.pic }}>
                      PIC
                      <ResizeHandle column="pic" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.jenisKerjaSama }}>
                      Jenis Kerja Sama
                      <ResizeHandle column="jenisKerjaSama" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.progressPercentage }}>
                      Progress%
                      <ResizeHandle column="progressPercentage" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.latestDateUpdated }}>
                      Latest Date
                      <ResizeHandle column="latestDateUpdated" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.latestUpdate }}>
                      Latest Update
                      <ResizeHandle column="latestUpdate" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.actionPlan }}>
                      Action Plan
                      <ResizeHandle column="actionPlan" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.targetDate }}>
                      Target Date
                      <ResizeHandle column="targetDate" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.linkDokumen }}>
                      Link Dokumen
                      <ResizeHandle column="linkDokumen" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.latestActivity }}>
                      Latest Activity
                      <ResizeHandle column="latestActivity" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.latestActivityStatus }}>
                      Activity Status
                      <ResizeHandle column="latestActivityStatus" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-1 text-center w-16">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <SortableContext items={filteredRows.map(r => r.clientId)} strategy={verticalListSortingStrategy}>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No partnerships found. Click "Add Row" to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, idx) => (
                        <SortableRow key={row.clientId} id={row.clientId} className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${row.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                          {/* Code (Read-Only) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.code }}>
                            <div className="w-full px-2 py-1 text-xs text-gray-700 dark:text-gray-300">{row.code}</div>
                          </td>

                          {/* Kode - Dropdown */}
                          <td className="px-2 py-1" style={{ width: columnWidths.kode }}>
                            <select
                              value={row.kode}
                              onChange={(e) => updateCell(idx, 'kode', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 dark:bg-gray-800"
                            >
                              <option value="">Select</option>
                              {masterData?.kodes?.map((k: any) => (
                                <option key={k.id} value={k.name}>{k.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Branch - Dropdown */}
                          <td className="px-2 py-1" style={{ width: columnWidths.branch }}>
                            <select
                              value={row.branchId}
                              onChange={(e) => updateCell(idx, 'branchId', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 dark:bg-gray-800"
                            >
                              <option value="">Select</option>
                              {masterData?.branches?.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Nama Calon Mitra (Read-Only) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.namaCalonMitra }}>
                            <div className="w-full px-2 py-1 text-xs text-gray-700 dark:text-gray-300 truncate" title={row.namaCalonMitra}>{row.namaCalonMitra}</div>
                          </td>

                          {/* Prioritas - Dropdown */}
                          <td className="px-2 py-1" style={{ width: columnWidths.prioritas }}>
                            <select
                              value={row.prioritasId}
                              onChange={(e) => updateCell(idx, 'prioritasId', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 dark:bg-gray-800"
                            >
                              <option value="">Select</option>
                              {masterData?.prioritas?.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* PIC - Dropdown */}
                          <td className="px-2 py-1" style={{ width: columnWidths.pic }}>
                            <select
                              value={row.picId}
                              onChange={(e) => updateCell(idx, 'picId', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 dark:bg-gray-800"
                            >
                              <option value="">Select</option>
                              {masterData?.pics?.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Jenis Kerja Sama */}
                          <td className="px-2 py-1" style={{ width: columnWidths.jenisKerjaSama }}>
                            <div className={`relative ${isCellInSelection(idx, 'jenisKerjaSama') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'jenisKerjaSama')}>
                              <textarea
                                value={row.jenisKerjaSama || ''}
                                onChange={(e) => updateCell(idx, 'jenisKerjaSama', e.target.value)}
                                onFocus={() => handleCellFocus(idx, 'jenisKerjaSama')}
                                onPaste={(e) => handlePaste(e, idx, 6)}
                                onInput={autoResize}
                                className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                                rows={1}
                              />
                              {isCellActive(idx, 'jenisKerjaSama') && (
                                <div
                                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair"
                                  onMouseDown={(e) => handleFillMouseDown(e, idx)}
                                />
                              )}
                            </div>
                          </td>

                          {/* Progress % - READ ONLY (auto-calculated) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.progressPercentage }}>
                            <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded">
                              {row.progressPercentage}%
                            </div>
                          </td>

                          {/* Latest Date Updated - READ ONLY (auto-calculated) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.latestDateUpdated }}>
                            <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded">
                              {row.latestDateUpdated ? formatDateShort(row.latestDateUpdated) : '-'}
                            </div>
                          </td>

                          {/* Latest Update - READ ONLY (auto-calculated) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.latestUpdate }}>
                            <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded max-h-20 overflow-auto">
                              {row.latestUpdate || '-'}
                            </div>
                          </td>

                          {/* Action Plan - READ ONLY (auto-calculated) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.actionPlan }}>
                            <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded max-h-20 overflow-auto">
                              {row.actionPlan || '-'}
                            </div>
                          </td>

                          {/* Target Date - READ ONLY (auto-calculated) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.targetDate }}>
                            <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded">
                              {row.targetDate ? formatDateShort(row.targetDate) : '-'}
                            </div>
                          </td>

                          {/* Link Dokumen */}
                          <td className="px-2 py-1" style={{ width: columnWidths.linkDokumen }}>
                            <div className={`relative ${isCellInSelection(idx, 'linkDokumen') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'linkDokumen')}>
                              <input
                                type="url"
                                value={row.linkDokumen}
                                onChange={(e) => updateCell(idx, 'linkDokumen', e.target.value)}
                                onFocus={() => handleCellFocus(idx, 'linkDokumen')}
                                onPaste={(e) => handlePaste(e, idx, 12)}
                                className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                                placeholder="https://..."
                              />
                              {isCellActive(idx, 'linkDokumen') && (
                                <div
                                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair"
                                  onMouseDown={(e) => handleFillMouseDown(e, idx)}
                                />
                              )}
                            </div>
                          </td>

                          {/* Latest Activity - READ ONLY (auto-calculated) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.latestActivity }}>
                            <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded max-h-20 overflow-auto">
                              {row.latestActivity || '-'}
                            </div>
                          </td>

                          {/* Activity Status - READ ONLY (auto-calculated) */}
                          <td className="px-2 py-1" style={{ width: columnWidths.latestActivityStatus }}>
                            <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded">
                              {row.latestActivityStatusId ?
                                masterData?.statuses?.find((s: any) => s.id === parseInt(String(row.latestActivityStatusId)))?.name || '-'
                                : '-'
                              }
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={() => deleteRow(idx)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </SortableRow>
                      ))
                    )}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}