'use client';

import React, { useState, useEffect, ClipboardEvent } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

interface PKROpexRow {
  id?: number;
  date: string;
  mitra: string;
  description: string;
  saldoTopUp: string;
  saldoPRK: string;
  evidence: string;
  pic: string;
  isNew?: boolean;
  isDirty?: boolean;
}

interface PKROpexTabProps {
  pkrOpex: any[];
  loading: boolean;
  onOpenModal: (type: string, item?: any) => void;
  onDelete: (type: string, id: number) => void;
}

export default function PKROpexTab({
  pkrOpex,
  loading,
  onOpenModal,
  onDelete,
}: PKROpexTabProps) {
  const [rows, setRows] = useState<PKROpexRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Load data into editable state
  useEffect(() => {
    const opexRows = pkrOpex.map(p => ({
      ...p,
      date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
      saldoTopUp: p.saldoTopUp?.toString() || '',
      saldoPRK: p.saldoPRK?.toString() || '',
      evidence: p.evidence || '',
      isDirty: false,
      isNew: false,
    }));
    setRows(opexRows);
  }, [pkrOpex]);

  const updateCell = (index: number, field: keyof PKROpexRow, value: any) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value, isDirty: true };
      return newRows;
    });
  };

  const addRow = () => {
    const newRow: PKROpexRow = {
      date: new Date().toISOString().split('T')[0],
      mitra: '',
      description: '',
      saldoTopUp: '',
      saldoPRK: '',
      evidence: '',
      pic: '',
      isNew: true,
      isDirty: true,
    };
    setRows(prev => [...prev, newRow]);
  };

  const deleteRow = async (index: number) => {
    const row = rows[index];
    if (row.id) {
      await onDelete('pkr-opex', row.id);
    }
    setRows(prev => prev.filter((_, i) => i !== index));
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

  const saveAllChanges = async () => {
    setSaving(true);
    try {
      for (const row of rows) {
        if (row.isDirty) {
          const method = row.isNew ? 'POST' : 'PUT';
          const { isDirty, isNew, ...cleanRow } = row;
          
          await fetch('/api/pkr-opex', {
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

  const formatCurrency = (value: string) => {
    if (!value) return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              KRONOLOGI PRK Produk Digital Partnership
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Daily Progress</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addRow}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md transition-colors"
            >
              <Plus size={20} />
              Add Row
            </button>
            <button
              onClick={saveAllChanges}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md transition-colors"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-blue-50 dark:bg-gray-900 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-28">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Mitra</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Description</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-32">Saldo Top Up</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-32">Saldo PRK</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Evidence</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 w-24">PIC</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 w-16">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No PKR Opex entries found. Click "Add Row" to create one.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id || `new-${idx}`} className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${row.isDirty ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                    <td className="px-2 py-1">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateCell(idx, 'date', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 0)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <textarea
                        value={row.mitra}
                        onChange={(e) => updateCell(idx, 'mitra', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 1)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                        rows={1}
                        placeholder="Mitra name..."
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <textarea
                        value={row.description}
                        onChange={(e) => updateCell(idx, 'description', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 2)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                        rows={1}
                        placeholder="Description..."
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={row.saldoTopUp}
                        onChange={(e) => updateCell(idx, 'saldoTopUp', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 3)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                        placeholder="0"
                        step="0.01"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatCurrency(row.saldoTopUp)}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={row.saldoPRK}
                        onChange={(e) => updateCell(idx, 'saldoPRK', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 4)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                        placeholder="0"
                        step="0.01"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatCurrency(row.saldoPRK)}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="url"
                        value={row.evidence}
                        onChange={(e) => updateCell(idx, 'evidence', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 5)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100"
                        placeholder="https://..."
                      />
                    </td>
                    <td className="px-2 py-1">
                      <textarea
                        value={row.pic}
                        onChange={(e) => updateCell(idx, 'pic', e.target.value)}
                        onPaste={(e) => handlePaste(e, idx, 6)}
                        className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded dark:text-gray-100 resize-none overflow-hidden"
                        rows={1}
                        placeholder="PIC..."
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => deleteRow(idx)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete row"
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