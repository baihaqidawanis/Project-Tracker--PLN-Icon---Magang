'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Undo2, Redo2 } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';


interface MasterTabProps {
  masterData: any;
  onRefresh: () => void;
}

export default function MasterTab({ masterData, onRefresh }: MasterTabProps) {
  const [activeSection, setActiveSection] = useState('prioritas');
  const [newItemName, setNewItemName] = useState('');
  const [newItemEmail, setNewItemEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Checkbox multi-select state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const sections = [
    { id: 'prioritas', label: 'Prioritas', data: masterData.prioritas },
    { id: 'pics', label: 'Master PIC', data: masterData.pics, hasEmail: true },
    { id: 'statuses', label: 'Master Status', data: masterData.statuses },
    { id: 'activityTypes', label: 'Activity Type', data: masterData.activityTypes },
    { id: 'bnps', label: 'Master BnP', data: masterData.bnps },
    { id: 'sos', label: 'Master SO', data: masterData.sos },
    { id: 'branches', label: 'Branch', data: masterData.branches },
    { id: 'kodes', label: 'Kode', data: masterData.kodes },
  ];

  const currentSection = sections.find(s => s.id === activeSection);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsAdding(true);
    try {
      const payload: any = { type: activeSection, name: newItemName.trim() };
      if (currentSection?.hasEmail) {
        payload.email = newItemEmail.trim() || `${newItemName.toLowerCase().replace(/\s+/g, '.')}@pln.co.id`;
      }

      const res = await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNewItemName('');
        setNewItemEmail('');
        onRefresh();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add item');
      }
    } catch (error) {
      alert('Failed to add item');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/master?type=${activeSection}&id=${id}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            onRefresh();
            // Remove from selection if selected
            setSelectedRows(prev => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
          } else {
            const error = await res.json();
            alert(error.error || 'Failed to delete item');
          }
        } catch (error) {
          alert('Failed to delete item');
        } finally {
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } });
        }
      }
    });
  };

  // Toggle row selection
  const toggleRowSelection = (id: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select/deselect all rows
  const toggleSelectAll = () => {
    const currentData = currentSection?.data || [];
    if (selectedRows.size === currentData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(currentData.map((item: any) => item.id)));
    }
  };

  // Bulk delete selected rows
  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected Items',
      message: `Are you sure you want to delete ${selectedRows.size} selected item(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // Delete all selected items
          const deletePromises = Array.from(selectedRows).map(id =>
            fetch(`/api/master?type=${activeSection}&id=${id}`, {
              method: 'DELETE',
            })
          );

          await Promise.all(deletePromises);
          onRefresh();
          setSelectedRows(new Set());
        } catch (error) {
          alert('Failed to delete items');
        } finally {
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } });
        }
      }
    });
  };

  return (
    <div>
      {/* Section Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeSection === section.id
                  ? 'bg-blue-600 text-white dark:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Item Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Add New {currentSection?.label}
        </h3>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Enter name..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {currentSection?.hasEmail && (
            <input
              type="email"
              value={newItemEmail}
              onChange={(e) => setNewItemEmail(e.target.value)}
              placeholder="Email (optional)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          <button
            type="submit"
            disabled={isAdding}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Plus size={20} />
            Add
          </button>
        </form>
      </div>

      {/* Master Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentSection?.label} List
            </h3>

            <div className="flex gap-3 items-center">
              {/* Bulk Delete Button */}
              {selectedRows.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors"
                >
                  <Trash2 size={18} />
                  Delete Selected ({selectedRows.size})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Select All Checkbox */}
          {currentSection?.data?.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentSection?.data?.length > 0 && selectedRows.size === currentSection?.data?.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer" onClick={toggleSelectAll}>
                Select All
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentSection?.data?.map((item: any) => (
              <div
                key={item.id}
                className={`flex justify-between items-center p-3 rounded-lg border ${selectedRows.has(item.id)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(item.id)}
                    onChange={() => toggleRowSelection(item.id)}
                    className="w-4 h-4 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                    {item.email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.email}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-2"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {currentSection?.data?.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No data found. Add your first item above.
            </p>
          )}
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
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => { } })}
      />
    </div>
  );
}