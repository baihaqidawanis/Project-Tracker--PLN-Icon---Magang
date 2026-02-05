'use client';

import React, { ClipboardEvent } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Trash2, Loader2, CheckCircle, ZoomIn, ZoomOut, Plus, Maximize, Minimize } from 'lucide-react';
import { ProgressRow, SaveStatus, ColumnWidths, FullScreenMode } from './types';
import SortableRow from './SortableRow';
import ResizeHandle from './ResizeHandle';
import DateDisplayInput from './DateDisplayInput';

interface DailyProgressTableProps {
  progressRows: ProgressRow[];
  setProgressRows: React.Dispatch<React.SetStateAction<ProgressRow[]>>;
  progressZoom: number;
  setProgressZoom: (zoom: number) => void;
  saveStatus: SaveStatus;
  progressColumnWidths: ColumnWidths;
  fullScreenMode: FullScreenMode;
  setFullScreenMode: React.Dispatch<React.SetStateAction<FullScreenMode>>;
  onColumnResizeStart: (e: React.MouseEvent, table: 'workflow' | 'progress', column: string) => void;
  onAddRow: () => void;
  onDelete: (index: number) => void;
  onBulkDelete: (ids: number[]) => void;
  masterData: any;
  // Fill handle props
  isCellActive: (rowIndex: number, field: string, table: 'workflow' | 'progress') => boolean;
  isCellInSelection: (rowIndex: number, field: string, table: 'workflow' | 'progress') => boolean;
  handleCellFocus: (rowIndex: number, field: string, table: 'workflow' | 'progress') => void;
  handleFillMouseDown: (e: React.MouseEvent, rowIndex: number) => void;
  handleFillMouseEnter: (rowIndex: number, field: string, table: 'workflow' | 'progress') => void;
  isDraggingFill: boolean;
}

export default function DailyProgressTable({
  progressRows,
  setProgressRows,
  progressZoom,
  setProgressZoom,
  saveStatus,
  progressColumnWidths,
  fullScreenMode,
  setFullScreenMode,
  onColumnResizeStart,
  onAddRow,
  onDelete,
  onBulkDelete,
  masterData,
  isCellActive,
  isCellInSelection,
  handleCellFocus,
  handleFillMouseDown,
  handleFillMouseEnter,
  isDraggingFill
}: DailyProgressTableProps) {

  const [internalRows, setInternalRows] = React.useState<ProgressRow[]>(progressRows);
  const prevProgressRowsRef = React.useRef<ProgressRow[]>(progressRows);
  
  // Checkbox multi-select state
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  // Only sync when parent rows actually change (not from our own updates)
  React.useEffect(() => {
    if (progressRows !== prevProgressRowsRef.current) {
      setInternalRows(progressRows);
      prevProgressRowsRef.current = progressRows;
    }
  }, [progressRows]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = internalRows.findIndex((item) => item.clientId === active.id);
    const newIndex = internalRows.findIndex((item) => item.clientId === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newRows = arrayMove(internalRows, oldIndex, newIndex);
      const updatedRows = newRows.map((row, index) => ({ ...row, isDirty: true, sortOrder: index }));
      
      // Update local state
      setInternalRows(updatedRows);
      // Sync to parent for autosave
      setProgressRows(updatedRows);
      prevProgressRowsRef.current = updatedRows;
    }
  };

  const updateCell = (index: number, field: keyof ProgressRow, value: any) => {
    const newRows = [...internalRows];
    newRows[index] = { ...newRows[index], [field]: value, isDirty: true };
    
    // Update local state
    setInternalRows(newRows);
    // Sync to parent for autosave
    setProgressRows(newRows);
    prevProgressRowsRef.current = newRows;
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
    if (selectedRows.size === internalRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(internalRows.map(row => row.clientId)));
    }
  };

  // Bulk delete selected rows
  const handleBulkDelete = () => {
    // Get IDs of selected rows
    const idsToDelete = internalRows
      .filter(row => selectedRows.has(row.clientId) && row.id)
      .map(row => row.id!);

    if (idsToDelete.length > 0) {
      onBulkDelete(idsToDelete);
      setSelectedRows(new Set());
    }
  };

  const handlePaste = (e: ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const rows = pastedData.split('\n').map(row => row.split('\t'));
    const fields: (keyof ProgressRow)[] = ['date', 'activityType', 'description', 'targetIfPlan', 'pic', 'category'];
    
    setInternalRows(prev => {
      const newRows = [...prev];
      rows.forEach((rowData, rIdx) => {
        const targetRowIndex = rowIndex + rIdx;
        if (targetRowIndex >= newRows.length) {
          newRows.push({ 
            clientId: `new-${Date.now()}-${rIdx}`, 
            date: '', 
            activityType: '', 
            description: '', 
            targetIfPlan: '', 
            pic: '', 
            category: '', 
            isNew: true, 
            isDirty: true 
          });
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

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
  };

  return (
    <div className={fullScreenMode === 'progress' ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-auto p-8' : ''}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-blue-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Progress</h3>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Bulk Delete Button */}
            {selectedRows.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedRows.size})
              </button>
            )}

            {/* Save Status Indicator */}
            <div className="min-w-[100px]">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                fullScreenMode === 'progress'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              title={fullScreenMode === 'progress' ? "Exit Daily Progress Full-Screen" : "Daily Progress Full-Screen"}
            >
              {fullScreenMode === 'progress' ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>

            {/* Add Row Button */}
            <button onClick={onAddRow} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1">
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
              onDragEnd={handleDragEnd}
            >
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="px-1 py-2 w-8"></th>
                    <th className="px-2 py-2 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={internalRows.length > 0 && selectedRows.size === internalRows.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.date }}>
                      Date
                      <ResizeHandle table="progress" column="date" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.activityType }}>
                      Type
                      <ResizeHandle table="progress" column="activityType" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.description }}>
                      Description
                      <ResizeHandle table="progress" column="description" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.targetIfPlan }}>
                      <div>
                        Target
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 font-normal">(if plan)</div>
                      </div>
                      <ResizeHandle table="progress" column="targetIfPlan" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" style={{ width: progressColumnWidths.pic }}>
                      PIC
                      <ResizeHandle table="progress" column="pic" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 relative" style={{ width: progressColumnWidths.category }}>
                      Cat 1
                      <ResizeHandle table="progress" column="category" onResizeStart={onColumnResizeStart} />
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
                          {/* Checkbox */}
                          <td className="px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(row.clientId)}
                              onChange={() => toggleRowSelection(row.clientId)}
                              className="w-4 h-4 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>

                          <td className="px-2 py-1" style={{ width: progressColumnWidths.date, wordWrap: 'break-word' }}>
                            <div className={`relative w-full ${isCellInSelection(rowIdx, 'date', 'progress') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                              onMouseEnter={() => handleFillMouseEnter(rowIdx, 'date', 'progress')}>
                              <DateDisplayInput
                                value={row.date}
                                onChange={(value) => updateCell(rowIdx, 'date', value)}
                                onFocus={() => handleCellFocus(rowIdx, 'date', 'progress')}
                                onPaste={(e) => handlePaste(e, rowIdx, 0)}
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
                                onChange={e => updateCell(rowIdx, 'activityType', e.target.value)}
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
                                onChange={(e) => updateCell(rowIdx, 'description', e.target.value)}
                                onPaste={(e) => {
                                  e.preventDefault();
                                  const pastedData = e.clipboardData.getData('text');
                                  const normalized = pastedData.replace(/\r\n|\r/g, '\n');
                                  updateCell(rowIdx, 'description', normalized);
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
                                onChange={(value) => updateCell(rowIdx, 'targetIfPlan', value)}
                                onFocus={() => handleCellFocus(rowIdx, 'targetIfPlan', 'progress')}
                                onPaste={(e) => handlePaste(e, rowIdx, 3)}
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
                                onChange={(e) => updateCell(rowIdx, 'pic', e.target.value)}
                                onPaste={(e) => handlePaste(e, rowIdx, 4)}
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
                              className={`w-full px-2 py-1 text-xs bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded font-semibold cursor-not-allowed break-words ${
                                cat1 === 'Update' ? 'text-green-600 dark:text-green-400' : 
                                cat1 === 'Plan' ? 'text-red-600 dark:text-red-400' : 
                                'text-gray-400 dark:text-gray-500'
                              }`}
                              style={{ fontSize: 11, wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                              tabIndex={-1}
                            />
                          </td>
                          <td className="px-1 py-1 text-center">
                            <button onClick={() => onDelete(rowIdx)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
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
  );
}
