'use client';

import React, { ClipboardEvent } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Trash2, Loader2, CheckCircle, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { WorkflowRow, SaveStatus, ColumnWidths, FullScreenMode } from './types';
import SortableRow from './SortableRow';
import ResizeHandle from './ResizeHandle';

interface WorkflowTableProps {
  workflowRows: WorkflowRow[];
  setWorkflowRows: React.Dispatch<React.SetStateAction<WorkflowRow[]>>;
  workflowZoom: number;
  setWorkflowZoom: (zoom: number) => void;
  compactMode: boolean;
  saveStatus: SaveStatus;
  workflowColumnWidths: ColumnWidths;
  fullScreenMode: FullScreenMode;
  setFullScreenMode: React.Dispatch<React.SetStateAction<FullScreenMode>>;
  onColumnResizeStart: (e: React.MouseEvent, table: 'workflow' | 'progress', column: string) => void;
  onAddMain: () => void;
  onAddSub: () => void;
  onDelete: (index: number) => void;
  // Fill handle props
  isCellActive: (rowIndex: number, field: string, table: 'workflow' | 'progress') => boolean;
  isCellInSelection: (rowIndex: number, field: string, table: 'workflow' | 'progress') => boolean;
  handleCellFocus: (rowIndex: number, field: string, table: 'workflow' | 'progress') => void;
  handleFillMouseDown: (e: React.MouseEvent, rowIndex: number) => void;
  handleFillMouseEnter: (rowIndex: number, field: string, table: 'workflow' | 'progress') => void;
  isDraggingFill: boolean;
}

export default function WorkflowTable({
  workflowRows,
  setWorkflowRows,
  workflowZoom,
  setWorkflowZoom,
  compactMode,
  saveStatus,
  workflowColumnWidths,
  fullScreenMode,
  setFullScreenMode,
  onColumnResizeStart,
  onAddMain,
  onAddSub,
  onDelete,
  isCellActive,
  isCellInSelection,
  handleCellFocus,
  handleFillMouseDown,
  handleFillMouseEnter,
  isDraggingFill
}: WorkflowTableProps) {

  const [internalRows, setInternalRows] = React.useState<WorkflowRow[]>(workflowRows);
  
  // Checkbox multi-select state
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());

  // Sync internal state with parent
  React.useEffect(() => {
    setInternalRows(workflowRows);
  }, [workflowRows, setInternalRows]);

  React.useEffect(() => {
    if (JSON.stringify(internalRows) !== JSON.stringify(workflowRows)) {
      setWorkflowRows(internalRows);
    }
  }, [internalRows]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setInternalRows((items) => {
      const oldIndex = items.findIndex((item) => item.clientId === active.id);
      const newIndex = items.findIndex((item) => item.clientId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newRows = arrayMove(items, oldIndex, newIndex);
        return newRows.map((row, index) => ({ ...row, isDirty: true, sortOrder: index }));
      }
      return items;
    });
  };

  const updateCell = (index: number, field: keyof WorkflowRow, value: any) => {
    setInternalRows(prev => {
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
    // Get all selected row indices
    const indicesToDelete = internalRows
      .map((row, idx) => selectedRows.has(row.clientId) ? idx : -1)
      .filter(idx => idx !== -1)
      .sort((a, b) => b - a); // Sort descending to delete from end

    // Delete each row (from end to start to maintain indices)
    for (const idx of indicesToDelete) {
      onDelete(idx);
    }

    setSelectedRows(new Set());
  };

  const handlePaste = (e: ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const rows = pastedData.split('\n').map(row => row.split('\t'));
    const fields: (keyof WorkflowRow)[] = ['no', 'activity', 'bobot', 'target', 'status', 'progress'];
    
    setInternalRows(prev => {
      const newRows = [...prev];
      rows.forEach((rowData, rIdx) => {
        const targetRowIndex = rowIndex + rIdx;
        if (targetRowIndex >= newRows.length) {
          newRows.push({ 
            clientId: `new-${Date.now()}-${rIdx}`, 
            type: 'sub', 
            no: '', 
            activity: '', 
            bobot: 0, 
            target: '', 
            status: '', 
            progress: 0, 
            isNew: true, 
            isDirty: true 
          });
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

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = 'auto';
    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
  };

  return (
    <div className={fullScreenMode === 'workflow' ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-auto p-8' : ''}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-blue-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workflow</h3>

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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                fullScreenMode === 'workflow'
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
            <button onClick={onAddMain} className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1">
              + Main
            </button>
            <button onClick={onAddSub} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1">
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
              onDragEnd={handleDragEnd}
            >
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className={compactMode ? "px-1 py-1 w-8" : "px-1 py-2 w-8"}></th>
                    <th className={compactMode ? "px-2 py-1 w-8 text-center" : "px-2 py-2 w-8 text-center"}>
                      <input
                        type="checkbox"
                        checked={internalRows.length > 0 && selectedRows.size === internalRows.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        title="Select all"
                      />
                    </th>
                    <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.no }}>
                      No
                      <ResizeHandle table="workflow" column="no" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.activity }}>
                      Activity
                      <ResizeHandle table="workflow" column="activity" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.bobot }}>
                      Bobot%
                      <ResizeHandle table="workflow" column="bobot" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.target }}>
                      Target
                      <ResizeHandle table="workflow" column="target" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.status }}>
                      Status
                      <ResizeHandle table="workflow" column="status" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className={compactMode ? "px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative" : "px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 relative"} style={{ width: workflowColumnWidths.progress }}>
                      Progress%
                      <ResizeHandle table="workflow" column="progress" onResizeStart={onColumnResizeStart} />
                    </th>
                    <th className={compactMode ? "px-1 py-1 text-center w-8" : "px-1 py-1 text-center w-8"}></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" style={{ fontSize: compactMode ? 9 : 10 }}>
                  <SortableContext
                    items={internalRows.map(r => r.clientId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {internalRows.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No workflows yet.</td></tr>
                    ) : (
                      internalRows.map((row, rowIdx) => (
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

                          <td className="px-2 py-1" style={{ width: workflowColumnWidths.no, wordWrap: 'break-word' }}>
                            {row.type === 'main' ? (
                              <div className={`relative w-full ${isCellInSelection(rowIdx, 'no', 'workflow') ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                onMouseEnter={() => handleFillMouseEnter(rowIdx, 'no', 'workflow')}>
                                <input type="text" value={row.no}
                                  onFocus={() => handleCellFocus(rowIdx, 'no', 'workflow')}
                                  onChange={(e) => updateCell(rowIdx, 'no', e.target.value)}
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
                                onChange={(e) => updateCell(rowIdx, 'activity', e.target.value)}
                                onPaste={(e) => {
                                  e.preventDefault();
                                  const pastedData = e.clipboardData.getData('text');
                                  const normalized = pastedData.replace(/\r\n|\r/g, '\n');
                                  updateCell(rowIdx, 'activity', normalized);
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
                                  onChange={(e) => updateCell(rowIdx, 'bobot', parseInt(e.target.value) || 0)}
                                  onPaste={(e) => handlePaste(e, rowIdx, 2)}
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
                                  onChange={(e) => updateCell(rowIdx, 'target', e.target.value)}
                                  onPaste={(e) => handlePaste(e, rowIdx, 3)}
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
                                  onChange={(e) => updateCell(rowIdx, 'status', e.target.value)}
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
                            <button onClick={() => onDelete(rowIdx)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                          </td>
                        </SortableRow>
                      ))
                    )}
                  </SortableContext>
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">TOTAL</td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-left">
                      {internalRows.filter(r => r.type === 'sub').reduce((sum, row) => sum + (row.bobot || 0), 0)}%
                    </td>
                    <td className="px-2 py-2"></td>
                    <td className="px-2 py-2"></td>
                    <td className="px-2 py-2 text-gray-900 dark:text-white text-left pl-3">
                      {internalRows.filter(r => r.type === 'sub').reduce((sum, row) => sum + (row.progress || 0), 0)}%
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
  );
}
