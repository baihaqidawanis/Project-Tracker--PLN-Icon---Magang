/**
 * Type definitions for PageTab component and its sub-components
 */

export interface WorkflowRow {
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

export interface ProgressRow {
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

export type FullScreenMode = 'none' | 'workflow' | 'progress' | 'both';

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface ActiveCell {
  rowIndex: number;
  field: string;
  table: 'workflow' | 'progress';
}

export interface FillSelection {
  startRow: number;
  endRow: number;
}

export interface ResizingColumn {
  table: 'workflow' | 'progress';
  column: string;
  startX: number;
  startWidth: number;
}

export type ColumnWidths = Record<string, number>;
