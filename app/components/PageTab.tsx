'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Maximize2, Minimize } from 'lucide-react';
import Select from 'react-select';
import { ConfirmDialog } from './ConfirmDialog';
import {
  WorkflowRow,
  ProgressRow,
  FullScreenMode,
  useColumnResize,
  useZoomControl,
  useAutoSave,
  useFillHandle,
  WorkflowTable,
  DailyProgressTable
} from './features/page-tab';

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
  onSyncBeforeUnmount?: (pageId: number, workflows: any[], progress: any[]) => void;
};

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
  onDelete,
  onSyncBeforeUnmount
}: PageTabProps) {
  // Constants for localStorage keys
  const STORAGE_KEY_WORKFLOW_WIDTHS = 'pln_project_tracker_workflow_widths';
  const STORAGE_KEY_PROGRESS_WIDTHS = 'pln_project_tracker_progress_widths';
  const STORAGE_KEY_WORKFLOW_ZOOM = 'pln_workflow_zoom';
  const STORAGE_KEY_PROGRESS_ZOOM = 'pln_progress_zoom';
  const STORAGE_KEY_COMPACT_MODE = 'pln_compact_mode';

  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [previousPagesLength, setPreviousPagesLength] = useState(0);

  // Data States
  const [workflowRows, setWorkflowRows] = useState<WorkflowRow[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);

  // Column Resize Hook
  const {
    workflowColumnWidths,
    progressColumnWidths,
    handleColumnResizeStart,
    handleGlobalMouseMove,
    handleGlobalMouseUp
  } = useColumnResize({
    storageKeyWorkflow: STORAGE_KEY_WORKFLOW_WIDTHS,
    storageKeyProgress: STORAGE_KEY_PROGRESS_WIDTHS,
    defaultWorkflowWidths: {
      no: 64,
      activity: 200,
      bobot: 64,
      target: 96,
      status: 112,
      progress: 80,
    },
    defaultProgressWidths: {
      date: 96,
      activityType: 112,
      description: 200,
      targetIfPlan: 112,
      pic: 80,
      category: 80,
    }
  });

  // Zoom Control Hook
  const {
    workflowZoom,
    setWorkflowZoom,
    progressZoom,
    setProgressZoom,
    compactMode,
    setCompactMode
  } = useZoomControl({
    storageKeyWorkflow: STORAGE_KEY_WORKFLOW_ZOOM,
    storageKeyProgress: STORAGE_KEY_PROGRESS_ZOOM,
    storageKeyCompact: STORAGE_KEY_COMPACT_MODE
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // Auto-Save Hook
  const { saveStatus } = useAutoSave({
    selectedPageId,
    workflowRows,
    progressRows,
    setWorkflowRows,
    setProgressRows,
    onSyncBeforeUnmount
  });

  // Fill Handle Hook
  const {
    activeCell,
    isDraggingFill,
    fillSelection,
    isCellActive,
    isCellInSelection,
    handleCellFocus,
    handleFillMouseDown,
    handleFillMouseEnter,
    handleGlobalClick,
    clearFillSelection,
    setActiveCell
  } = useFillHandle();

  // Global event handlers for fill and resize
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingFill && activeCell && fillSelection) {
        const { startRow, endRow } = fillSelection;
        if (startRow !== endRow) {
          if (activeCell.table === 'workflow') {
            handleWorkflowFill(activeCell, startRow, endRow);
          } else {
            handleProgressFill(activeCell, startRow, endRow);
          }
        }
        clearFillSelection();
      }
      handleGlobalMouseUp();
    };

    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDraggingFill, activeCell, fillSelection, handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalClick, clearFillSelection]);

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
  }, [workflowRows, progressRows]);

  const handleWorkflowFill = (source: { rowIndex: number; field: string }, start: number, end: number) => {
    setWorkflowRows(prev => {
      const newRows = [...prev];
      const sourceValue = newRows[source.rowIndex][source.field as keyof WorkflowRow];

      const min = Math.min(start, end);
      const max = Math.max(start, end);

      for (let i = min; i <= max; i++) {
        if (i === source.rowIndex) continue;
        newRows[i] = { ...newRows[i], [source.field]: sourceValue, isDirty: true };

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

  // --- WORKFLOW HANDLERS ---
  const addWorkflowMain = () => {
    if (!selectedPageId) return;
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

  const deleteWorkflowRow = async (index: number) => {
    const row = workflowRows[index];
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Workflow Row',
      message: 'Are you sure you want to delete this row? This action cannot be undone.',
      onConfirm: async () => {
        if (row.id) {
          await onDelete('workflow', row.id);
          // Update parent state
          setWorkflows(prev => prev.filter(w => w.id !== row.id));
        }
        setWorkflowRows(prev => prev.filter((_, i) => i !== index));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } });
      }
    });
  };

  const bulkDeleteWorkflows = async (ids: number[]) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Workflows',
      message: `Are you sure you want to delete ${ids.length} workflow(s)? This action cannot be undone.`,
      onConfirm: async () => {
        // Delete from API
        await Promise.all(ids.map(id => onDelete('workflow', id)));
        // Remove from local state
        setWorkflowRows(prev => prev.filter(row => !ids.includes(row.id!)));
        // Update parent state to prevent reload
        setWorkflows(prev => prev.filter(w => !ids.includes(w.id)));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } });
      }
    });
  };

  // --- PROGRESS HANDLERS ---
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
      sortOrder: -1,
      isNew: true,
      isDirty: true
    };
    setProgressRows(prev => [newRow, ...prev].map((row, index) => ({ ...row, sortOrder: index })));
  };

  const deleteProgressRow = async (index: number) => {
    const row = progressRows[index];
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Progress Row',
      message: 'Are you sure you want to delete this row? This action cannot be undone.',
      onConfirm: async () => {
        if (row.id) {
          await onDelete('dailyProgress', row.id);
          // Update parent state
          setDailyProgress(prev => prev.filter(p => p.id !== row.id));
        }
        setProgressRows(prev => prev.filter((_, i) => i !== index));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } });
      }
    });
  };

  const bulkDeleteProgress = async (ids: number[]) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Daily Progress',
      message: `Are you sure you want to delete ${ids.length} progress row(s)? This action cannot be undone.`,
      onConfirm: async () => {
        // Delete from API
        await Promise.all(ids.map(id => onDelete('dailyProgress', id)));
        // Remove from local state
        setProgressRows(prev => prev.filter(row => !ids.includes(row.id!)));
        // Update parent state to prevent reload
        setDailyProgress(prev => prev.filter(p => !ids.includes(p.id)));
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } });
      }
    });
  };

  // --- SELECTION & LOAD ---
  const STORAGE_KEY_SELECTED_PAGE = 'pln_selected_page_id';

  // Save selected page to localStorage whenever it changes
  useEffect(() => {
    if (selectedPageId !== null) {
      localStorage.setItem(STORAGE_KEY_SELECTED_PAGE, selectedPageId.toString());
    }
  }, [selectedPageId]);

  // Handle page selection logic when pages load or change
  useEffect(() => {
    if (!Array.isArray(pages) || pages.length === 0) {
      setPreviousPagesLength(0);
      return;
    }

    // 1. If we already have a valid selection, keep it (Unless a NEW page was just added)
    const isCurrentValid = selectedPageId !== null && pages.some(p => p.id === selectedPageId);

    // UX: Auto-switch to new page if one was added (detect length increase)
    // Only applies if not initial load (previous > 0)
    if (previousPagesLength > 0 && pages.length > previousPagesLength) {
      const newestPage = [...pages].sort((a, b) => b.id - a.id)[0];
      if (newestPage && newestPage.id !== selectedPageId) {
        console.log('Auto-switching to new page:', newestPage.id);
        setSelectedPageId(newestPage.id);
        setPreviousPagesLength(pages.length);
        return;
      }
    }

    if (isCurrentValid) {
      // Just update length tracker
      if (pages.length !== previousPagesLength) {
        setPreviousPagesLength(pages.length);
      }
      return;
    }

    // 2. If no valid selection (e.g. init or deletion), try to recover from localStorage
    const savedId = localStorage.getItem(STORAGE_KEY_SELECTED_PAGE);
    const savedIdNum = savedId ? parseInt(savedId) : null;
    const isSavedValid = savedIdNum !== null && pages.some(p => p.id === savedIdNum);

    if (isSavedValid) {
      setSelectedPageId(savedIdNum);
    } else {
      // 3. Fallback to first page if nothing else works
      setSelectedPageId(pages[0].id);
    }

    // Update pages length tracker
    if (pages.length !== previousPagesLength) {
      setPreviousPagesLength(pages.length);
    }
  }, [pages]); // Only depend on pages array (and internal state refs)

  const selectedPage = Array.isArray(pages) ? pages.find(p => p.id === selectedPageId) : undefined;

  // Load workflows and progress from props ONLY when selectedPageId changes
  // Don't depend on workflows/dailyProgress to avoid reload when autosave updates them
  useEffect(() => {
    if (!selectedPageId) {
      setWorkflowRows([]);
      setProgressRows([]);
      return;
    }

    const pageWorkflows = workflows
      .filter(w => w.pageId === selectedPageId)
      .map((w: any, index: number) => ({
        ...w,
        clientId: w.id ? w.id.toString() : `temp-${index}`,
        type: w.no ? 'main' : 'sub',
        isDirty: false,
        isNew: false
      }));

    const pageProgress = dailyProgress
      .filter(p => p.pageId === selectedPageId)
      .map((p: any, index: number) => ({
        ...p,
        clientId: p.id ? p.id.toString() : `temp-${index}`,
        date: p.date || '',
        isDirty: false,
        isNew: false
      }));

    setWorkflowRows(pageWorkflows);
    setProgressRows(pageProgress);
  }, [selectedPageId]); // ONLY selectedPageId - don't reload when props update!

  const pageOptions = Array.isArray(pages)
    ? pages.map(page => ({
      value: page.id,
      label: `${page.pageNumber} - ${page.partnershipName}`
    }))
    : [];

  return (
    <div>
      {/* Page Selector */}
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

        {/* Global Full-Screen Button */}
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
            {/* Workflow Table */}
            {fullScreenMode !== 'progress' && (
              <WorkflowTable
                workflowRows={workflowRows}
                setWorkflowRows={setWorkflowRows}
                workflowZoom={workflowZoom}
                setWorkflowZoom={setWorkflowZoom}
                compactMode={compactMode}
                saveStatus={saveStatus}
                workflowColumnWidths={workflowColumnWidths}
                fullScreenMode={fullScreenMode}
                setFullScreenMode={setFullScreenMode}
                onColumnResizeStart={handleColumnResizeStart}
                onAddMain={addWorkflowMain}
                onAddSub={addWorkflowSub}
                onDelete={deleteWorkflowRow}
                onBulkDelete={bulkDeleteWorkflows}
                isCellActive={isCellActive}
                isCellInSelection={isCellInSelection}
                handleCellFocus={handleCellFocus}
                handleFillMouseDown={handleFillMouseDown}
                handleFillMouseEnter={handleFillMouseEnter}
                isDraggingFill={isDraggingFill}
              />
            )}

            {/* Daily Progress Table */}
            {fullScreenMode !== 'workflow' && (
              <DailyProgressTable
                progressRows={progressRows}
                setProgressRows={setProgressRows}
                progressZoom={progressZoom}
                setProgressZoom={setProgressZoom}
                saveStatus={saveStatus}
                progressColumnWidths={progressColumnWidths}
                fullScreenMode={fullScreenMode}
                setFullScreenMode={setFullScreenMode}
                onColumnResizeStart={handleColumnResizeStart}
                onAddRow={addProgressRow}
                onDelete={deleteProgressRow}
                onBulkDelete={bulkDeleteProgress}
                masterData={masterData}
                isCellActive={isCellActive}
                isCellInSelection={isCellInSelection}
                handleCellFocus={handleCellFocus}
                handleFillMouseDown={handleFillMouseDown}
                handleFillMouseEnter={handleFillMouseEnter}
                isDraggingFill={isDraggingFill}
              />
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } })}
      />
    </div>
  );
}
