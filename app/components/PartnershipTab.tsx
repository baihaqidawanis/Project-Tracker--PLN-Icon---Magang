'use client';

import React, { useState, useEffect, ClipboardEvent } from 'react';
import { Plus, Trash2, Save, Search } from 'lucide-react';

interface PartnershipRow {
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
}

export default function PartnershipTab({
  projects,
  masterData,
  loading,
  onOpenModal,
  onDelete,
}: PartnershipTabProps) {
  const [rows, setRows] = useState<PartnershipRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data into editable state
  useEffect(() => {
    const partnershipRows = projects.map(p => ({
      ...p,
      branchId: p.branchId || '',
      prioritasId: p.prioritasId || '',
      picId: p.picId || '',
      latestActivityStatusId: p.latestActivityStatusId || '',
      latestDateUpdated: p.latestDateUpdated ? new Date(p.latestDateUpdated).toISOString().split('T')[0] : '',
      targetDate: p.targetDate ? new Date(p.targetDate).toISOString().split('T')[0] : '',
      kode: p.kode || '',
      latestUpdate: p.latestUpdate || '',
      actionPlan: p.actionPlan || '',
      linkDokumen: p.linkDokumen || '',
      latestActivity: p.latestActivity || '',
      isDirty: false,
      isNew: false,
    }));
    setRows(partnershipRows);
  }, [projects]);

  const updateCell = (index: number, field: keyof PartnershipRow, value: any) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value, isDirty: true };
      return newRows;
    });
  };

  const addRow = () => {
    const newRow: PartnershipRow = {
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

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      for (const row of rows) {
        if (row.isDirty) {
          const method = row.isNew ? 'POST' : 'PUT';
          const url = row.isNew ? '/api/projects' : `/api/projects/${row.id}`;
          const { isDirty, isNew, branch, prioritas, pic, latestActivityStatus, ...cleanRow } = row;
          
          await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanRow)
          });
        }
      }
      window.location.reload();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = rows.filter(row => 
    row.namaCalonMitra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Search & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search partnerships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={addRow}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Add Row
          </button>
          <button
            onClick={saveAllChanges}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-blue-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Kode</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Branch</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Nama Mitra</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Priority</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">PIC</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Jenis Kerja Sama</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-20">Progress%</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Latest Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Latest Update</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action Plan</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Target Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Link Dokumen</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Latest Activity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 w-16">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No partnerships found. Click "Add Row" to create one.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.id || `new-${idx}`} className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${row.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) => updateCell(idx, 'code', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 0)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                        placeholder="Code..."
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={row.kode}
                        onChange={(e) => updateCell(idx, 'kode', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 1)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                      />
                    </td>
                    <td className="px-2 py-1">
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
                    <td className="px-2 py-1">
                      <textarea
                        value={row.namaCalonMitra}
                        onChange={(e) => updateCell(idx, 'namaCalonMitra', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 3)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                        rows={1}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="px-2 py-1">
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
                    <td className="px-2 py-1">
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
                    <td className="px-2 py-1">
                      <textarea
                        value={row.jenisKerjaSama}
                        onChange={(e) => updateCell(idx, 'jenisKerjaSama', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 6)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                        rows={1}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={row.progressPercentage}
                        onChange={(e) => updateCell(idx, 'progressPercentage', parseInt(e.target.value) || 0)}
                        onPaste={(e) => handlePaste(e, idx, 7)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="date"
                        value={row.latestDateUpdated}
                        onChange={(e) => updateCell(idx, 'latestDateUpdated', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 8)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <textarea
                        value={row.latestUpdate}
                        onChange={(e) => updateCell(idx, 'latestUpdate', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 9)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                        rows={1}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <textarea
                        value={row.actionPlan}
                        onChange={(e) => updateCell(idx, 'actionPlan', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 10)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                        rows={1}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="date"
                        value={row.targetDate}
                        onChange={(e) => updateCell(idx, 'targetDate', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 11)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="url"
                        value={row.linkDokumen}
                        onChange={(e) => updateCell(idx, 'linkDokumen', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 12)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                        placeholder="https://..."
                      />
                    </td>
                    <td className="px-2 py-1">
                      <textarea
                        value={row.latestActivity}
                        onChange={(e) => updateCell(idx, 'latestActivity', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 13)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                        rows={1}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="px-2 py-1">
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
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => deleteRow(idx)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}