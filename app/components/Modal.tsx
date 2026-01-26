'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  show: boolean;
  type: string;
  editingItem: any;
  masterData: any;
  projects: any[];
  pages: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function Modal({
  show,
  type,
  editingItem,
  masterData,
  projects,
  pages,
  onClose,
  onSubmit,
}: ModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    console.log('[Modal useEffect] Type:', type, 'EditingItem:', editingItem);
    if (editingItem) {
      if (type === 'page') {
        // For page type, ensure proper field mapping
        const pageData = {
          pageNumber: editingItem.pageNumber || '',
          partnershipName: editingItem.partnershipName || '',
        };
        console.log('[Modal useEffect] Setting page formData:', pageData);
        setFormData(pageData);
      } else if (type === 'workflow') {
        // For workflow type, map only required fields
        const workflowData = {
          pageId: editingItem.pageId || '',
          no: editingItem.no || 1,
          activity: editingItem.activity || '',
          bobot: editingItem.bobot || 0,
          target: editingItem.target || '',
          status: editingItem.status || '',
          progress: editingItem.progress || 0,
        };
        console.log('[Modal useEffect] Setting workflow formData:', workflowData);
        setFormData(workflowData);
      } else if (type === 'progress') {
        // For progress type, map only required fields
        const progressData = {
          pageId: editingItem.pageId || '',
          date: editingItem.date ? new Date(editingItem.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          activityType: editingItem.activityType || '',
          description: editingItem.description || '',
          targetIfPlan: editingItem.targetIfPlan || '',
          pic: editingItem.pic || '',
          category: editingItem.category || '',
        };
        console.log('[Modal useEffect] Setting progress formData:', progressData);
        setFormData(progressData);
      } else {
        console.log('[Modal useEffect] Setting formData from editingItem');
        setFormData(editingItem);
      }
    } else {
      console.log('[Modal useEffect] Resetting form');
      resetForm();
    }
  }, [editingItem, type]);

  const resetForm = () => {
    if (type === 'project') {
      setFormData({
        code: '',
        kode: '',
        branchId: '',
        namaCalonMitra: '',
        prioritasId: '',
        picId: '',
        jenisKerjaSama: '',
        progressPercentage: 0,
        latestUpdate: '',
        actionPlan: '',
        targetDate: '',
        linkDokumen: '',
        latestActivity: '',
        latestActivityStatusId: ''
      });
    } else if (type === 'page') {
      setFormData({
        pageNumber: '',
        partnershipName: '',
      });
    } else if (type === 'workflow') {
      setFormData({
        pageId: editingItem?.pageId || '',
        no: 1,
        activity: '',
        bobot: 0,
        target: '',
        status: '',
        progress: 0
      });
    } else if (type === 'progress') {
      setFormData({
        pageId: editingItem?.pageId || '',
        date: new Date().toISOString().split('T')[0],
        activityType: '',
        description: '',
        targetIfPlan: '',
        pic: '',
        category: ''
      });
    } else if (type === 'pkr-opex') {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mitra: '',
        description: '',
        saldoTopUp: '',
        saldoPRK: '',
        evidence: '',
        pic: ''
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`[Modal] Field changed - ${name}:`, value);
    setFormData((prev: any) => {
      const newData = { ...prev, [name]: value };
      console.log('[Modal] Updated formData:', newData);
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let submitData = { ...formData };
    if (type === 'page') {
      // Auto-format page number: P.01, P.02, ...
      const num = parseInt(formData.pageNumber, 10);
      if (!isNaN(num)) {
        submitData.pageNumber = `P.${num.toString().padStart(2, '0')}`;
      }
    }
    onSubmit(submitData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {editingItem ? 'Edit' : 'Add New'} {type === 'project' ? 'Partnership' : type === 'pkr-opex' ? 'PKR Opex' : type.charAt(0).toUpperCase() + type.slice(1)}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Partnership Form */}
          {type === 'project' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kode</label>
                  <input
                    type="text"
                    name="kode"
                    value={formData.kode || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch *</label>
                  <select
                    name="branchId"
                    value={formData.branchId || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Branch</option>
                    {masterData.branches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prioritas *</label>
                  <select
                    name="prioritasId"
                    value={formData.prioritasId || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Prioritas</option>
                    {masterData.prioritas?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Calon Mitra *</label>
                <input
                  type="text"
                  name="namaCalonMitra"
                  value={formData.namaCalonMitra || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PIC *</label>
                  <select
                    name="picId"
                    value={formData.picId || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select PIC</option>
                    {masterData.pics?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jenis Kerja Sama *</label>
                  <input
                    type="text"
                    name="jenisKerjaSama"
                    value={formData.jenisKerjaSama || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progress (%)</label>
                  <input
                    type="number"
                    name="progressPercentage"
                    value={formData.progressPercentage || 0}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Date</label>
                  <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latest Update</label>
                <textarea
                  name="latestUpdate"
                  value={formData.latestUpdate || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Plan</label>
                <textarea
                  name="actionPlan"
                  value={formData.actionPlan || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latest Activity</label>
                <textarea
                  name="latestActivity"
                  value={formData.latestActivity || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Status</label>
                  <select
                    name="latestActivityStatusId"
                    value={formData.latestActivityStatusId || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    {masterData.statuses?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link Dokumen</label>
                  <input
                    type="url"
                    name="linkDokumen"
                    value={formData.linkDokumen || ''}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
 {/* Page Form */}
{type === 'page' && (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page Number *</label>
        <input
          type="number"
          name="pageNumber"
          value={formData.pageNumber ? formData.pageNumber.replace(/[^0-9]/g, '') : ''}
          onChange={handleChange}
          placeholder="1, 2, 3, ..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Partnership *</label>
        <input
          type="text"
          name="partnershipName"
          value={formData.partnershipName || ''}
          onChange={handleChange}
          placeholder="e.g., Bank Mega"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
    </div>
  </div>
)}
          {/* Workflow Form */}
          {type === 'workflow' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page *</label>
                <select
                  name="pageId"
                  value={formData.pageId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Page</option>
                  {pages?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.pageNumber} - {p.project?.namaCalonMitra}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">No *</label>
                  <input
                    type="number"
                    name="no"
                    value={formData.no || 1}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bobot *</label>
                  <input
                    type="number"
                    name="bobot"
                    value={formData.bobot || 0}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity *</label>
                <textarea
                  name="activity"
                  value={formData.activity || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target</label>
                  <input
                    type="text"
                    name="target"
                    value={formData.target || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <input
                    type="text"
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progress (%)</label>
                <input
                  type="number"
                  name="progress"
                  value={formData.progress || 0}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Daily Progress Form */}
          {type === 'progress' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page *</label>
                <select
                  name="pageId"
                  value={formData.pageId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Page</option>
                  {pages?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.pageNumber} - {p.project?.namaCalonMitra}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Type *</label>
                  <select
                    name="activityType"
                    value={formData.activityType || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Activity Type</option>
                    {masterData.activityTypes?.map((a: any) => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target (if Plan)</label>
                  <input
                    type="text"
                    name="targetIfPlan"
                    value={formData.targetIfPlan || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PIC *</label>
                  <input
                    type="text"
                    name="pic"
                    value={formData.pic || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cat 1 *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* PKR Opex Form */}
          {type === 'pkr-opex' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mitra *</label>
                  <input
                    type="text"
                    name="mitra"
                    value={formData.mitra || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saldo Top Up</label>
                  <input
                    type="number"
                    name="saldoTopUp"
                    value={formData.saldoTopUp || ''}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saldo PRK</label>
                  <input
                    type="number"
                    name="saldoPRK"
                    value={formData.saldoPRK || ''}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Evidence (Link)</label>
                  <input
                    type="url"
                    name="evidence"
                    value={formData.evidence || ''}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PIC *</label>
<input
type="text"
name="pic"
value={formData.pic || ''}
onChange={handleChange}
className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
required
/>
</div>
</div>
</div>
)}
{/* Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition-colors"
        >
          {editingItem ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  </div>
</div>
);
}