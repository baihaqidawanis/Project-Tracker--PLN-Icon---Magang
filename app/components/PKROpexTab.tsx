'use client';

import React, { useState, useEffect, useRef, ClipboardEvent } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, GripVertical, Loader2, CheckCircle, Upload, Eye, X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useUndoRedo } from '../hooks/useUndoRedo';
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
import { formatDateShort, formatDateForInput } from '../lib/date-utils';

interface PKROpexRow {
  clientId: string;
  id?: number;
  date: string;
  mitra: string;
  description: string;
  saldoTopUp: string;
  saldoPRK: string;
  evidence: string;
  pic: string;
  sortOrder?: number;
  isNew?: boolean;
  isDirty?: boolean;
}

interface PKROpexTabProps {
  pkrOpex: any[];
  setPkrOpex: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  onOpenModal: (type: string, item?: any) => void;
  onDelete: (type: string, id: number) => void;
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

export default function PKROpexTab({
  pkrOpex,
  setPkrOpex,
  loading,
  onOpenModal,
  onDelete,
}: PKROpexTabProps) {
  const STORAGE_KEY_WIDTHS = 'pln_pkr_opex_widths';
  const STORAGE_KEY_ZOOM = 'pln_pkr_opex_zoom';

  const [rows, setRows] = useState<PKROpexRow[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // Checkbox multi-select state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Ref for save-on-unmount
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const [zoom, setZoom] = useState(100);

  const [activeCell, setActiveCell] = useState<{ rowIndex: number; field: string } | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [fillSelection, setFillSelection] = useState<{ startRow: number; endRow: number } | null>(null);

  // --- DRAG FILL LOGIC ---
  const handleFill = (source: { rowIndex: number; field: string }, start: number, end: number) => {
    setRows(prev => {
      const newRows = [...prev];
      const sourceValue = newRows[source.rowIndex][source.field as keyof PKROpexRow];

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
    if (isDraggingFill && activeCell && activeCell.field === field) {
      setFillSelection(prev => prev ? { ...prev, endRow: rowIndex } : null);
    }
  };

  // Global Mouse Up for Fill
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingFill && activeCell && fillSelection) {
        handleFill(activeCell, fillSelection.startRow, fillSelection.endRow);
        setIsDraggingFill(false);
        setFillSelection(null);
      }
    };

    if (isDraggingFill) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDraggingFill, activeCell, fillSelection]);


  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Column widths
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    date: 110,
    mitra: 150,
    description: 250,
    saldoTopUp: 140,
    saldoPRK: 140,
    evidence: 280,
    pic: 100,
  });

  const [resizingColumn, setResizingColumn] = useState<{
    column: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const widthsRef = useRef(columnWidths);
  widthsRef.current = columnWidths;

  // Track if component has mounted
  const hasMountedRef = useRef(false);

  // Load settings from localStorage
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

      if (savedZoom) setZoom(parseInt(savedZoom));

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
    localStorage.setItem(STORAGE_KEY_ZOOM, zoom.toString());
  }, [zoom]);

  // Handle resize
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (resizingColumn) {
        setResizingColumn(null);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const delta = e.clientX - resizingColumn.startX;
        const newWidth = Math.max(60, resizingColumn.startWidth + delta);
        setColumnWidths(prev => ({
          ...prev,
          [resizingColumn.column]: newWidth
        }));
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [resizingColumn]);

  const handleColumnResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn({
      column,
      startX: e.clientX,
      startWidth: columnWidths[column]
    });
  };

  // Wheel event for zoom (Ctrl+Scroll)
  useEffect(() => {
    const container = document.getElementById('pkr-table-container');

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.1;
        setZoom(prev => {
          const newZoom = prev + delta;
          return Math.round(Math.min(200, Math.max(30, newZoom)));
        });
      }
    };

    if (container) {
      container.addEventListener('wheel', handleWheel as EventListener, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel as EventListener);
      }
    };
  }, [zoom]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Load data into editable state
  useEffect(() => {
    if (!Array.isArray(pkrOpex)) return;
    const opexRows = pkrOpex.map((p, index) => ({
      ...p,
      clientId: p.id ? p.id.toString() : `temp-${index}`,
      date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
      saldoTopUp: p.saldoTopUp?.toString() || '',
      saldoPRK: p.saldoPRK?.toString() || '',
      evidence: p.evidence || '',
      isDirty: false,
      isNew: false,
    }));

    // Sort by sortOrder if available (preserves user's manual order)
    // Otherwise keep original order from backend
    const sortedRows = opexRows.sort((a, b) => {
      // Prioritize rows with sortOrder
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      // If only one has sortOrder, put it first
      if (a.sortOrder !== undefined) return -1;
      if (b.sortOrder !== undefined) return 1;

      return 0; // Keep original order if neither has sortOrder
    });

    setRows(sortedRows);
  }, [pkrOpex]);

  const updateCell = (index: number, field: keyof PKROpexRow, value: any) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value, isDirty: true };
      return newRows;
    });
  };

  // File upload handler
  const handleFileUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
        return;
      }

      const data = await response.json();
      // Update cell with S3 presigned URL
      updateCell(index, 'evidence', data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    }
  };

  // File delete handler
  const handleFileDelete = async (index: number, fileUrl: string) => {
    try {
      // Extract S3 key from presigned URL
      // MinIO presigned URL format: http://localhost:9000/plnprojecttracker/evidence/filename.ext?X-Amz-...
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split('/').filter(p => p); // Remove empty strings
      // pathParts = ['plnprojecttracker', 'evidence', 'filename.ext']
      const s3Key = pathParts.slice(1).join('/'); // Skip bucket name, get 'evidence/filename.ext'
      
      if (!s3Key) {
        alert('Invalid file URL');
        return;
      }
      
      const response = await fetch(`/api/upload/${encodeURIComponent(s3Key)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to delete file');
        return;
      }

      // Clear evidence cell
      updateCell(index, 'evidence', '');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  const addRow = () => {
    const newRow: PKROpexRow = {
      clientId: `new-${Date.now()}`,
      date: '',
      mitra: '',
      description: '',
      saldoTopUp: '',
      saldoPRK: '',
      evidence: '',
      pic: '',
      sortOrder: -1, // New rows at top
      isNew: true,
      isDirty: true,
    };
    // Add new row at the beginning (index 0)
    setRows(prev => [newRow, ...prev].map((row, index) => ({ ...row, sortOrder: index })));
  };

  const deleteRow = async (index: number) => {
    const row = rows[index];
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Row',
      message: 'Are you sure you want to delete this row? This action cannot be undone.',
      onConfirm: async () => {
        if (row.id) {
          await onDelete('pkr-opex', row.id);
        }
        setRows(prev => prev.filter((_, i) => i !== index));
        // Remove from selection if selected
        setSelectedRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(row.clientId);
          return newSet;
        });
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };
  
  // Bulk delete selected rows
  const deleteBulk = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected Rows',
      message: `Are you sure you want to delete ${selectedRows.size} selected row(s)? This action cannot be undone.`,
      onConfirm: async () => {
        const rowsToDelete = rows.filter(row => selectedRows.has(row.clientId));
        
        // Delete from backend
        for (const row of rowsToDelete) {
          if (row.id) {
            await onDelete('pkr-opex', row.id);
          }
        }
        
        // Remove from state
        setRows(prev => prev.filter(row => !selectedRows.has(row.clientId)));
        setSelectedRows(new Set());
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };
  
  // Toggle row selection
  const toggleRowSelection = (clientId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };
  
  // Select/deselect all rows
  const toggleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map(row => row.clientId)));
    }
  };

  const handlePaste = (e: ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedRows = pastedData.split('\n').map(row => row.split('\t'));

    const fields: (keyof PKROpexRow)[] = ['date', 'mitra', 'description', 'saldoTopUp', 'saldoPRK', 'evidence', 'pic'];

    setRows(prev => {
      const newRows = [...prev];
      pastedRows.forEach((rowData, rIdx) => {
        const targetRowIndex = rowIndex + rIdx;
        if (targetRowIndex >= newRows.length) {
          newRows.push({
            clientId: `new-${Date.now()}-${rIdx}`,
            date: new Date().toISOString().split('T')[0],
            mitra: '',
            description: '',
            saldoTopUp: '',
            saldoPRK: '',
            evidence: '',
            pic: '',
            isNew: true,
            isDirty: true,
          });
        }

        rowData.forEach((cellData, cIdx) => {
          const targetColIndex = colIndex + cIdx;
          if (targetColIndex < fields.length) {
            const field = fields[targetColIndex];
            newRows[targetRowIndex] = {
              ...newRows[targetRowIndex],
              [field]: cellData.trim(),
              isDirty: true
            };
          }
        });
      });
      return newRows;
    });
  };

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

      // Save all dirty rows in parallel for better performance
      const savePromises = dirtyRows.map(async ({ row, index }) => {
        const method = row.isNew ? 'POST' : 'PUT';
        const { isDirty, isNew, clientId, ...cleanRow } = row;
        const body = { ...cleanRow, sortOrder: index };

        const res = await fetch('/api/pkr-opex', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          const savedData = await res.json();
          return { index, savedData, success: true };
        }
        return { index, success: false };
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

  // Auto-Save with debounce
  useEffect(() => {
    const hasDirty = rows.some(r => r.isDirty);

    if (hasDirty) {
      setSaveStatus('saving');

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveDirtyRows();
      }, 1000); // Reduced from 2000ms to 1000ms for faster auto-save
    } else {
      setSaveStatus('saved');
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [rows]);

  // Save on Unmount Effect - only save to DB
  useEffect(() => {
    return () => {
      const currentRows = rowsRef.current;
      const dirtyRows = currentRows.filter(r => r.isDirty);

      // Save any remaining dirty data to DB
      if (dirtyRows.length > 0) {
        dirtyRows.forEach(row => {
          const method = row.isNew ? 'POST' : 'PUT';
          const { isDirty, isNew, clientId, ...cleanRow } = row;
          const body = { ...cleanRow, sortOrder: row.sortOrder ?? 0 };

          fetch('/api/pkr-opex', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true
          }).catch(err => console.error('Unmount save failed', err));
        });
      }
    };
  }, []);

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
  };

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

    const timer = setTimeout(resizeAllTextareas, 100);
    return () => clearTimeout(timer);
  }, [rows]);

  // ... (formatCurrency, autoResize, useEffect resizeAllTextareas omitted)

  return (
    <div>
      {/* ... (Header omitted) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              KRONOLOGI PRK Produk Digital Partnership
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Daily Progress</p>
          </div>
          <div className="flex gap-3 items-center">
            {/* Bulk Delete Button */}
            {selectedRows.size > 0 && (
              <button
                onClick={deleteBulk}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors"
              >
                <Trash2 size={18} />
                Delete Selected ({selectedRows.size})
              </button>
            )}
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setZoom(Math.max(30, zoom - 10))}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="number"
                value={zoom}
                onChange={(e) => setZoom(Math.min(200, Math.max(30, Number(e.target.value) || 100)))}
                className="w-14 px-2 py-1 text-center border-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                min="30"
                max="200"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
            </div>

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

            <button
              onClick={addRow}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors"
            >
              <Plus size={18} />
              Add Row
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-auto" style={{ maxHeight: '600px' }}>
          <div
            id="pkr-table-container"
            style={{
              zoom: zoom / 100,
              minWidth: 'max-content'
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ minWidth: 'max-content' }}>
                <thead className="bg-blue-50 dark:bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="px-1 py-2 w-8"></th>
                    <th className="px-2 py-2 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && selectedRows.size === rows.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.date }}>
                      Date
                      <ResizeHandle column="date" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.mitra }}>
                      Mitra
                      <ResizeHandle column="mitra" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.description }}>
                      Description
                      <ResizeHandle column="description" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.saldoTopUp }}>
                      Saldo Top Up
                      <ResizeHandle column="saldoTopUp" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.saldoPRK }}>
                      Saldo PRK
                      <ResizeHandle column="saldoPRK" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.evidence }}>
                      Evidence
                      <ResizeHandle column="evidence" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: columnWidths.pic }}>
                      PIC
                      <ResizeHandle column="pic" onResizeStart={handleColumnResizeStart} />
                    </th>
                    <th className="px-1 py-1 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" style={{ fontSize: 10 }}>
                  <SortableContext
                    items={rows.map(r => r.clientId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          No PKR Opex entries found. Click "Add Row" to create one.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => (
                        <SortableRow
                          key={row.clientId}
                          id={row.clientId}
                          className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${row.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} ${selectedRows.has(row.clientId) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                          <td className="px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(row.clientId)}
                              onChange={() => toggleRowSelection(row.clientId)}
                              className="w-4 h-4 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-2 py-1" style={{ width: columnWidths.date }}>
                            <div className={`relative w-full ${isCellInSelection(idx, 'date') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'date')}>
                              <DateDisplayInput
                                value={row.date}
                                onChange={(value) => updateCell(idx, 'date', value)}
                                onFocus={() => handleCellFocus(idx, 'date')}
                                onPaste={(e) => handlePaste(e, idx, 0)}
                                className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                                style={{ fontSize: 10 }}
                              />
                              {isCellActive(idx, 'date') && !isDraggingFill && (
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, idx)} />
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1" style={{ width: columnWidths.mitra }}>
                            <div className={`relative w-full ${isCellInSelection(idx, 'mitra') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'mitra')}>
                              <textarea
                                value={row.mitra}
                                onFocus={() => handleCellFocus(idx, 'mitra')}
                                onChange={(e) => updateCell(idx, 'mitra', e.target.value)}
                                onPaste={(e) => handlePaste(e, idx, 1)}
                                className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                                style={{ fontSize: 10 }}
                                rows={1}
                                onInput={autoResize}
                                placeholder="Mitra name..."
                              />
                              {isCellActive(idx, 'mitra') && !isDraggingFill && (
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, idx)} />
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1" style={{ width: columnWidths.description }}>
                            <div className={`relative w-full ${isCellInSelection(idx, 'description') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'description')}>
                              <textarea
                                value={row.description}
                                onFocus={() => handleCellFocus(idx, 'description')}
                                onChange={(e) => updateCell(idx, 'description', e.target.value)}
                                onPaste={(e) => handlePaste(e, idx, 2)}
                                className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                                style={{ fontSize: 10 }}
                                rows={1}
                                onInput={autoResize}
                                placeholder="Description..."
                              />
                              {isCellActive(idx, 'description') && !isDraggingFill && (
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, idx)} />
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1" style={{ width: columnWidths.saldoTopUp }}>
                            <div className={`relative w-full ${isCellInSelection(idx, 'saldoTopUp') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'saldoTopUp')}>
                              <CurrencyInput
                                value={row.saldoTopUp}
                                onFocus={() => handleCellFocus(idx, 'saldoTopUp')}
                                onChange={(value) => updateCell(idx, 'saldoTopUp', value)}
                                onPaste={(e) => handlePaste(e, idx, 3)}
                                formatCurrency={formatCurrency}
                              />
                              {isCellActive(idx, 'saldoTopUp') && !isDraggingFill && (
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, idx)} />
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1" style={{ width: columnWidths.saldoPRK }}>
                            <div className={`relative w-full ${isCellInSelection(idx, 'saldoPRK') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'saldoPRK')}>
                              <CurrencyInput
                                value={row.saldoPRK}
                                onFocus={() => handleCellFocus(idx, 'saldoPRK')}
                                onChange={(value) => updateCell(idx, 'saldoPRK', value)}
                                onPaste={(e) => handlePaste(e, idx, 4)}
                                formatCurrency={formatCurrency}
                              />
                              {isCellActive(idx, 'saldoPRK') && !isDraggingFill && (
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, idx)} />
                              )}
                            </div>
                          </td>
                          {/* Evidence - FILE UPLOAD */}
                          <td className="px-2 py-1" style={{ width: columnWidths.evidence }}>
                            <div className={`relative w-full ${isCellInSelection(idx, 'evidence') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'evidence')}>
                              <div className="flex items-center gap-1">
                                {/* Upload Button */}
                                <label className="flex items-center justify-center px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer text-xs">
                                  <Upload className="w-3 h-3 mr-1" />
                                  <span>Upload</span>
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(idx, file);
                                      }
                                    }}
                                  />
                                </label>
                                
                                {/* Show filename/preview if evidence exists */}
                                {row.evidence && (
                                  <>
                                    {/* View/Download button */}
                                    <a 
                                      href={row.evidence} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                                      title="View file"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </a>
                                    
                                    {/* Delete button */}
                                    <button
                                      onClick={() => handleFileDelete(idx, row.evidence)}
                                      className="flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                      title="Remove file"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                    
                                    {/* Show filename */}
                                    <span className="text-xs truncate flex-1 dark:text-gray-300" title={row.evidence}>
                                      {row.evidence.split('/').pop()}
                                    </span>
                                  </>
                                )}
                              </div>
                              {isCellActive(idx, 'evidence') && !isDraggingFill && (
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, idx)} />
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1" style={{ width: columnWidths.pic }}>
                            <div className={`relative w-full ${isCellInSelection(idx, 'pic') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(idx, 'pic')}>
                              <textarea
                                value={row.pic}
                                onFocus={() => handleCellFocus(idx, 'pic')}
                                onChange={(e) => updateCell(idx, 'pic', e.target.value)}
                                onPaste={(e) => handlePaste(e, idx, 6)}
                                className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                                style={{ fontSize: 10 }}
                                rows={1}
                                onInput={autoResize}
                                placeholder="PIC..."
                              />
                              {isCellActive(idx, 'pic') && !isDraggingFill && (
                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-600 border border-white cursor-crosshair z-20" onMouseDown={(e) => handleFillMouseDown(e, idx)} />
                              )}
                            </div>
                          </td>
                          <td className="px-1 py-1 text-center">
                            <button
                              onClick={() => deleteRow(idx)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete row"
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
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
}

// Currency Input Component - Separate untuk menghindari re-render issue
interface CurrencyInputProps {
  value: string;
  onFocus?: () => void;
  onChange: (value: string) => void;
  onPaste: (e: ClipboardEvent) => void;
  formatCurrency: (value: string) => string;
}

function CurrencyInput({ value, onFocus, onChange, onPaste, formatCurrency }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused && value) {
      setDisplayValue(formatCurrency(value));
    } else if (!isFocused) {
      setDisplayValue('');
    }
  }, [value, isFocused, formatCurrency]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (value) {
      setDisplayValue(formatCurrency(value));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setDisplayValue(rawValue);
    onChange(rawValue);
  };

  return (
    <input
      type="text"
      value={isFocused ? displayValue : (displayValue || '')}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPaste={onPaste}
      className="w-full px-2 py-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 text-right"
      style={{ fontSize: 10 }}
      placeholder="0"
    />
  );
}