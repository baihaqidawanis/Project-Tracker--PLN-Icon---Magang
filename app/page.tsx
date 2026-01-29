'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Header from './components/header';
import TabNavigation from './components/TabNavigation';
import PartnershipTab from './components/PartnershipTab';
import PageTab from './components/PageTab';
import MasterTab from './components/MasterTab';
import PKROpexTab from './components/PKROpexTab';
import PivotTab from './components/PivotTab';
import ReportTab from './components/ReportTab';
import Modal from './components/Modal';

type FullScreenMode = 'none' | 'workflow' | 'progress' | 'both';

export default function ProjectTracker() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('pivot');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Data states
  const [projects, setProjects] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [dailyProgress, setDailyProgress] = useState<any[]>([]);
  const [pkrOpex, setPkrOpex] = useState<any[]>([]);
  const [masterData, setMasterData] = useState({
    pics: [],
    branches: [],
    prioritas: [],
    statuses: [],
    kodes: [],
    bnps: [],
    sos: [],
    activityTypes: []
  });

  // Full-screen state - FIXED: Changed from boolean to FullScreenMode type
  const [fullScreenMode, setFullScreenMode] = useState<FullScreenMode>('none');

  // Load full-screen preference from localStorage
  useEffect(() => {
    const savedFullScreen = localStorage.getItem('pln_fullscreen');
    if (savedFullScreen) {
      // Parse saved value as FullScreenMode
      const parsed = savedFullScreen as FullScreenMode;
      if (['none', 'workflow', 'progress', 'both'].includes(parsed)) {
        setFullScreenMode(parsed);
      }
    }
  }, []);

  // Save full-screen preference
  useEffect(() => {
    localStorage.setItem('pln_fullscreen', fullScreenMode);
  }, [fullScreenMode]);

  // Dark mode detection
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Load active tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [projectsRes, pagesRes, workflowsRes, progressRes, pkrRes, masterRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/pages'),
        fetch('/api/workflows'),
        fetch('/api/daily-progress'),
        fetch('/api/pkr-opex'),
        fetch('/api/master')
      ]);

      const [projectsData, pagesData, workflowsData, progressData, pkrData, masterDataRes] = await Promise.all([
        projectsRes.json(),
        pagesRes.json(),
        workflowsRes.json(),
        progressRes.json(),
        pkrRes.json(),
        masterRes.json()
      ]);

      setProjects(projectsData);
      setPages(pagesData);
      setWorkflows(workflowsData);
      setDailyProgress(progressData);
      setPkrOpex(pkrData);
      setMasterData(masterDataRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: string, item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      if (modalType === 'project') {
        const url = editingItem ? `/api/projects/${editingItem.id}` : '/api/projects';
        const method = editingItem ? 'PUT' : 'POST';

        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else if (modalType === 'page') {
        const url = editingItem ? `/api/pages?id=${editingItem.id}` : '/api/pages';
        const method = editingItem ? 'PUT' : 'POST';

        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else if (modalType === 'workflow') {
        const method = editingItem ? 'PUT' : 'POST';
        const body = editingItem ? { ...formData, id: editingItem.id } : formData;

        await fetch('/api/workflows', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else if (modalType === 'progress') {
        const method = editingItem ? 'PUT' : 'POST';
        const body = editingItem ? { ...formData, id: editingItem.id } : formData;

        await fetch('/api/daily-progress', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else if (modalType === 'pkr-opex') {
        const method = editingItem ? 'PUT' : 'POST';
        const body = editingItem ? { ...formData, id: editingItem.id } : formData;

        await fetch('/api/pkr-opex', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }

      await fetchAllData();
      closeModal();
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    // Langsung delete tanpa konfirmasi
    setLoading(true);
    try {
      if (type === 'project') {
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      } else if (type === 'page') {
        await fetch(`/api/pages?id=${id}`, { method: 'DELETE' });
      } else if (type === 'workflow') {
        await fetch(`/api/workflows?id=${id}`, { method: 'DELETE' });
      } else if (type === 'progress') {
        await fetch(`/api/daily-progress?id=${id}`, { method: 'DELETE' });
      } else if (type === 'pkr-opex') {
        await fetch(`/api/pkr-opex?id=${id}`, { method: 'DELETE' });
      }

      await fetchAllData();
    } catch (error) {
      console.error('Error deleting data:', error);
      alert('Error deleting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Check if we should hide header/sidebar based on fullScreenMode
  const shouldHideNavigation = fullScreenMode !== 'none';

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header - Hidden in full-screen */}
        {!shouldHideNavigation && (
          <Header
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Sidebar Navigation - Hidden in full-screen */}
        {!shouldHideNavigation && (
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Main Content */}
        <div
          className={`transition-all duration-300 ${shouldHideNavigation
              ? 'ml-0 pt-0'
              : sidebarCollapsed
                ? 'ml-16 pt-24'
                : 'ml-64 pt-24'
            }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {loading && activeTab !== 'master' ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={48} />
              </div>
            ) : (
              <>
                {activeTab === 'pivot' && (
                  <PivotTab projects={projects} masterData={masterData} />
                )}

                {activeTab === 'report' && (
                  <ReportTab projects={projects} masterData={masterData} />
                )}

                {activeTab === 'partnership' && (
                  <PartnershipTab
                    projects={projects}
                    masterData={masterData}
                    loading={loading}
                    onOpenModal={openModal}
                    onDelete={handleDelete}
                  />
                )}

                {activeTab === 'page' && (
                  <PageTab
                    pages={pages}
                    setPages={setPages}
                    workflows={workflows}
                    setWorkflows={setWorkflows}
                    dailyProgress={dailyProgress}
                    setDailyProgress={setDailyProgress}
                    masterData={masterData}
                    fullScreenMode={fullScreenMode}
                    setFullScreenMode={setFullScreenMode}
                    onOpenModal={openModal}
                    onDelete={handleDelete}
                  />
                )}

                {activeTab === 'master' && (
                  <MasterTab masterData={masterData} onRefresh={fetchAllData} />
                )}

                {activeTab === 'pkr-opex' && (
                  <PKROpexTab
                    pkrOpex={pkrOpex}
                    loading={loading}
                    onOpenModal={openModal}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal */}
        <Modal
          show={showModal}
          type={modalType}
          editingItem={editingItem}
          masterData={masterData}
          projects={projects}
          pages={pages}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}