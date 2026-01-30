'use client';

import React, { useState, useEffect, useRef, ClipboardEvent } from 'react';
import { Plus, Trash2, GripVertical, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
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
        } catch (e) { console.error('Failed to parse saved widths', e); }
      }
      if (savedZoom) setZoom(parseInt(savedZoom));
    }
  }, []);

  // Save widths when resizing ends
  useEffect(() => {
    if (!resizingColumn) {
      localStorage.setItem(STORAGE_KEY_WIDTHS, JSON.stringify(widthsRef.current));
    }
  }, [resizingColumn]);

  // Save zoom
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ZOOM, zoom.toString());
    setZoomInput(zoom.toString());
  }, [zoom]);

  // Save zoom
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ZOOM, zoom.toString());
    setZoomInput(zoom.toString());
  }, [zoom]);

  // ===== AUTO-CALCULATION FUNCTIONS =====

  // Calculate % Progress from workflows
  const calculateProgress = (code: string): number => {
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return 0;

    const pageWorkflows = workflows.filter(w => w.pageId === page.id);
    if (pageWorkflows.length === 0) return 0;

    const totalProgress = pageWorkflows.reduce((sum, w) => sum + (w.progress || 0), 0);
    return Math.round(totalProgress / 2); // Sum all then divide by 2 as requested
  };

  // Get latest date updated from daily progress (category = "Update")
  const getLatestDateUpdated = (code: string): string => {
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return '';

    const pageProgress = dailyProgress
      .filter(dp => dp.pageId === page.id && dp.category?.toLowerCase() === 'update')
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    if (pageProgress.length === 0) return '';
    return pageProgress[0].date ? formatDateForInput(pageProgress[0].date) : '';
  };

  // Get latest update description from daily progress (category = "Update")
  const getLatestUpdate = (code: string): string => {
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return '';

    const pageProgress = dailyProgress
      .filter(dp => dp.pageId === page.id && dp.category?.toLowerCase() === 'update')
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    if (pageProgress.length === 0) return '';
    return pageProgress[0].description || '';
  };

  // Get action plan from daily progress (category = "Plan")
  const getActionPlan = (code: string): string => {
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return '';

    const pageProgress = dailyProgress
      .filter(dp => dp.pageId === page.id && dp.category?.toLowerCase() === 'plan')
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    if (pageProgress.length === 0) return '';
    return pageProgress[0].description || '';
  };

  // Get target date from daily progress (category = "Plan")
  const getTargetDate = (code: string): string => {
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return '';

    const pageProgress = dailyProgress
      .filter(dp => dp.pageId === page.id && dp.category?.toLowerCase() === 'plan')
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    if (pageProgress.length === 0) return '';
    return pageProgress[0].targetIfPlan || '';
  };

  // Get latest activity from workflows (hierarchical: On Progress -> Not Started -> Done, search bottom-to-top)
  const getLatestActivity = (code: string): string => {
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return '';

    const pageWorkflows = workflows
      .filter(w => w.pageId === page.id)
      .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0)); // Bottom to top

    // Search for "On Progress" first
    const onProgress = pageWorkflows.find(w => w.status?.toLowerCase() === 'on progress');
    if (onProgress) return onProgress.activity || '';

    // Then "Not Started"
    const notStarted = pageWorkflows.find(w => w.status?.toLowerCase() === 'not started');
    if (notStarted) return notStarted.activity || '';

    // Finally "Done"
    const done = pageWorkflows.find(w => w.status?.toLowerCase() === 'done');
    if (done) return done.activity || '';

    return '';
  };

  // Get latest activity status from workflows (same logic as getLatestActivity)
  const getLatestActivityStatus = (code: string): string => {
    const page = pages.find(p => p.pageNumber === code);
    if (!page) return '';

    const pageWorkflows = workflows
      .filter(w => w.pageId === page.id)
      .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0)); // Bottom to top

    // Search for "On Progress" first
    const onProgress = pageWorkflows.find(w => w.status?.toLowerCase() === 'on progress');
    if (onProgress) {
      const statusObj = masterData.statuses?.find((s: any) => s.name?.toLowerCase() === 'on progress');
      return statusObj?.id?.toString() || '';
    }

    // Then "Not Started"
    const notStarted = pageWorkflows.find(w => w.status?.toLowerCase() === 'not started');
    if (notStarted) {
      const statusObj = masterData.statuses?.find((s: any) => s.name?.toLowerCase() === 'not started');
      return statusObj?.id?.toString() || '';
    }

    // Finally "Done"
    const done = pageWorkflows.find(w => w.status?.toLowerCase() === 'done');
    if (done) {
      const statusObj = masterData.statuses?.find((s: any) => s.name?.toLowerCase() === 'done');
      return statusObj?.id?.toString() || '';
    }

    return '';
  };

  // Load data into editable state with auto-calculations
  useEffect(() => {
    const partnershipRows = projects.map((p, index) => {
      const code = p.code || '';

      return {
        ...p,
        clientId: p.id ? p.id.toString() : `temp-${index}`,
        branchId: p.branchId || '',
        prioritasId: p.prioritasId || '',
        picId: p.picId || '',
        // Auto-calculate fields
        progressPercentage: calculateProgress(code),
        latestDateUpdated: getLatestDateUpdated(code),
        latestUpdate: getLatestUpdate(code),
        actionPlan: getActionPlan(code),
        targetDate: getTargetDate(code),
        latestActivity: getLatestActivity(code),
        latestActivityStatusId: getLatestActivityStatus(code),
        // Other fields
        kode: p.kode || '',
        linkDokumen: p.linkDokumen || '',
        sortOrder: p.sortOrder || index,
        isDirty: false,
        isNew: false,
      };
    });

    // Sort by sortOrder first, then by code numerically
    const sorted = partnershipRows.sort((a, b) => {
      // If both have sortOrder, use that
      if (a.sortOrder !== undefined && b.sortOrder !== undefined && a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      // Otherwise, sort by code numerically (P.01, P.02, P.03, etc.)
      const extractNumber = (code: string) => {
        const match = code.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };

      return extractNumber(a.code) - extractNumber(b.code);
    });

    setRows(sorted);
  }, [projects, pages, workflows, dailyProgress]);

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

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const updatedRows = [...rows];
      for (let i = 0; i < updatedRows.length; i++) {
        const row = updatedRows[i];
        if (row.isDirty) {
          const method = row.isNew ? 'POST' : 'PUT';
          const url = row.isNew ? '/api/projects' : `/api/projects/${row.id}`;
          const { isDirty, isNew, branch, prioritas, pic, latestActivityStatus, clientId, ...cleanRow } = row;

          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...cleanRow, sortOrder: i })
          });

          if (res.ok) {
            const savedData = await res.json();
            updatedRows[i] = {
              ...updatedRows[i],
              id: savedData.id || row.id,
              sortOrder: i,
              isNew: false,
              isDirty: false
            };
          }
        }
      }
      setRows(updatedRows);
      window.location.reload();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
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

          <button
            onClick={addRow}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Add Row
          </button>
        </div>
      </div>

      {/* Table - Updated: Numeric sorting, Excel-like zoom, scrollable */}
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
                          {/* Code */}
                          <td className="px-2 py-1" style={{ width: columnWidths.code }}>
                            <div className={`relative ${isCellInSelection(idx, 'code') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'code')}>
                              <input
                                type="text"
                                value={row.code}
                                onChange={(e) => updateCell(idx, 'code', e.target.value)}
                                onFocus={() => handleCellFocus(idx, 'code')}
                                onPaste={(e) => handlePaste(e, idx, 0)}
                                className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                                placeholder="Code..."
                              />
                              {isCellActive(idx, 'code') && (
                                <div
                                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair"
                                  onMouseDown={(e) => handleFillMouseDown(e, idx)}
                                />
                              )}
                            </div>
                          </td>

                          {/* Kode - Dropdown */}
                          <td className="px-2 py-1" style={{ width: columnWidths.kode }}>
                            <select
                              value={row.kode}
                              onChange={(e) => updateCell(idx, 'kode', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 dark:bg-gray-800"
                            >
                              <option value="">Select</option>
                              {masterData.kodes?.map((k: any) => (
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
                              {masterData.branches?.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Nama Calon Mitra */}
                          <td className="px-2 py-1" style={{ width: columnWidths.namaCalonMitra }}>
                            <div className={`relative ${isCellInSelection(idx, 'namaCalonMitra') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'namaCalonMitra')}>
                              <textarea
                                value={row.namaCalonMitra}
                                onChange={(e) => updateCell(idx, 'namaCalonMitra', e.target.value)}
                                onFocus={() => handleCellFocus(idx, 'namaCalonMitra')}
                                onPaste={(e) => handlePaste(e, idx, 3)}
                                onInput={autoResize}
                                className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                                rows={1}
                              />
                              {isCellActive(idx, 'namaCalonMitra') && (
                                <div
                                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair"
                                  onMouseDown={(e) => handleFillMouseDown(e, idx)}
                                />
                              )}
                            </div>
                          </td>

                          {/* Prioritas - Dropdown */}
                          <td className="px-2 py-1" style={{ width: columnWidths.prioritas }}>
                            <select
                              value={row.prioritasId}
                              onChange={(e) => updateCell(idx, 'prioritasId', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 dark:bg-gray-800"
                            >
                              <option value="">Select</option>
                              {masterData.prioritas?.map((p: any) => (
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
                              {masterData.pics?.map((p: any) => (
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

                          {/* Progress % */}
                          <td className="px-2 py-1" style={{ width: columnWidths.progressPercentage }}>
                            <div className={`relative ${isCellInSelection(idx, 'progressPercentage') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'progressPercentage')}>
                              <input
                                type="number"
                                value={row.progressPercentage}
                                onChange={(e) => updateCell(idx, 'progressPercentage', parseInt(e.target.value) || 0)}
                                onFocus={() => handleCellFocus(idx, 'progressPercentage')}
                                onPaste={(e) => handlePaste(e, idx, 7)}
                                className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                                min="0"
                                max="100"
                              />
                              {isCellActive(idx, 'progressPercentage') && (
                                <div
                                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair"
                                  onMouseDown={(e) => handleFillMouseDown(e, idx)}
                                />
                              )}
                            </div>
                          </td>

                          {/* Latest Date Updated */}
                          <td className="px-2 py-1" style={{ width: columnWidths.latestDateUpdated }}>
                            <div className={`relative ${isCellInSelection(idx, 'latestDateUpdated') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'latestDateUpdated')}>
                              <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300">
                                {row.latestDateUpdated ? formatDateShort(row.latestDateUpdated) : '-'}
                              </div>
                            </div>
                          </td>

                          {/* Latest Update */}
                          <td className="px-2 py-1" style={{ width: columnWidths.latestUpdate }}>
                            <div className={`relative ${isCellInSelection(idx, 'latestUpdate') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'latestUpdate')}>
                              <textarea
                                value={row.latestUpdate}
                                onChange={(e) => updateCell(idx, 'latestUpdate', e.target.value)}
                                onFocus={() => handleCellFocus(idx, 'latestUpdate')}
                                onPaste={(e) => handlePaste(e, idx, 9)}
                                onInput={autoResize}
                                className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                                rows={1}
                              />
                              {isCellActive(idx, 'latestUpdate') && (
                                <div
                                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair"
                                  onMouseDown={(e) => handleFillMouseDown(e, idx)}
                                />
                              )}
                            </div>
                          </td>

                          {/* Action Plan */}
                          <td className="px-2 py-1" style={{ width: columnWidths.actionPlan }}>
                            <div className={`relative ${isCellInSelection(idx, 'actionPlan') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'actionPlan')}>
                              <textarea
                                value={row.actionPlan}
                                onChange={(e) => updateCell(idx, 'actionPlan', e.target.value)}
                                onFocus={() => handleCellFocus(idx, 'actionPlan')}
                                onPaste={(e) => handlePaste(e, idx, 10)}
                                onInput={autoResize}
                                className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                                rows={1}
                              />
                              {isCellActive(idx, 'actionPlan') && (
                                <div
                                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair"
                                  onMouseDown={(e) => handleFillMouseDown(e, idx)}
                                />
                              )}
                            </div>
                          </td>

                          {/* Target Date */}
                          <td className="px-2 py-1" style={{ width: columnWidths.targetDate }}>
                            <div className={`relative ${isCellInSelection(idx, 'targetDate') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'targetDate')}>
                              <div className="w-full px-2 py-1 text-sm text-gray-600 dark:text-gray-300">
                                {row.targetDate ? formatDateShort(row.targetDate) : '-'}
                              </div>
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

                          {/* Latest Activity */}
                          <td className="px-2 py-1" style={{ width: columnWidths.latestActivity }}>
                            <div className={`relative ${isCellInSelection(idx, 'latestActivity') ? 'ring-2 ring-blue-500' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'latestActivity')}>
                              <textarea
                                value={row.latestActivity}
                                onChange={(e) => updateCell(idx, 'latestActivity', e.target.value)}
                                onFocus={() => handleCellFocus(idx, 'latestActivity')}
                                onPaste={(e) => handlePaste(e, idx, 13)}
                                onInput={autoResize}
                                className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                                rows={1}
                              />
                              {isCellActive(idx, 'latestActivity') && (
                                <div
                                  className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair"
                                  onMouseDown={(e) => handleFillMouseDown(e, idx)}
                                />
                              )}
                            </div>
                          </td>

                          {/* Activity Status - Dropdown */}
                          <td className="px-2 py-1" style={{ width: columnWidths.latestActivityStatus }}>
                            <select
                              value={row.latestActivityStatusId}
                              onChange={(e) => updateCell(idx, 'latestActivityStatusId', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 dark:bg-gray-800"
                            >
                              <option value="">Select</option>
                              {masterData.statuses?.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
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
      </div >
    </div >
  );
}