'use client';

import { useState, useEffect } from 'react';
import { ActiveCell, FillSelection, WorkflowRow, ProgressRow } from './types';

export function useFillHandle() {
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [isDraggingFill, setIsDraggingFill] = useState(false);
  const [fillSelection, setFillSelection] = useState<FillSelection | null>(null);

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

  const handleGlobalClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCellInput = target.closest('td') !== null;
    if (!isCellInput && !isDraggingFill) {
      setActiveCell(null);
    }
  };

  const clearFillSelection = () => {
    setIsDraggingFill(false);
    setFillSelection(null);
  };

  return {
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
  };
}
