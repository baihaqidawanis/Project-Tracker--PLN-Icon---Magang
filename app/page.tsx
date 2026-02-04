'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // ALL STATE DECLARATIONS MUST BE AT THE TOP - Before any conditionals or returns
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

  // Full-screen state
  const [fullScreenMode, setFullScreenMode] = useState<FullScreenMode>('none');
  
  // ALL useEffect HOOKS - Must be declared before any conditional returns
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load full-screen preference from localStorage
  useEffect(() => {
    const savedFullScreen = localStorage.getItem('pln_fullscreen');
    if (savedFullScreen) {
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
    } else {
      setActiveTab('pivot');
    }
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Save active tab
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Re-fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'pkr-opex') {
      fetch('/api/pkr-opex').then(r => r.json()).then(setPkrOpex).catch(console.error);
    }
    if (activeTab === 'partnership' || activeTab === 'pivot') {
      Promise.all([fetch('/api/projects'), fetch('/api/pages'), fetch('/api/workflows')])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(([p, pg, w]) => { setProjects(p); setPages(pg); setWorkflows(w); })
        .catch(console.error);
    }
    if (activeTab === 'pivot' || activeTab === 'report') {
      fetch('/api/projects').then(r => r.json()).then(setProjects).catch(console.error);
    }
  }, [activeTab]);

  // Fetch all data on mount
  useEffect(() => {
    // Don't fetch if not authenticated
    if (status !== 'authenticated') {
      return;
    }

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

        const [projectsData, pagesData, workflowsData, progressData, pkrData, masterData] = await Promise.all([
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
        setMasterData(masterData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [status]); // Add status dependency

  // Sync handler for PageTab unmount - updates parent state with latest child data
  const handlePageTabSync = useCallback((pageId: number, workflowsData: any[], progressData: any[]) => {
    // Update workflows: remove old data for this page and add fresh data
    setWorkflows(prev => {
      const otherPages = prev.filter(w => w.pageId !== pageId);
      return [...otherPages, ...workflowsData.map(w => ({ ...w, pageId }))];
    });

    // Update daily progress: remove old data for this page and add fresh data
    setDailyProgress(prev => {
      const otherPages = prev.filter(dp => dp.pageId !== pageId);
      return [...otherPages, ...progressData.map(p => ({ ...p, pageId }))];
    });
  }, []);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

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
              ? 'ml-16 pt-16'
              : 'ml-64 pt-16'
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
                    setProjects={setProjects}
                    masterData={masterData}
                    loading={loading}
                    onOpenModal={openModal}
                    onDelete={handleDelete}
                    pages={pages}
                    workflows={workflows}
                    dailyProgress={dailyProgress}
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
                    onSyncBeforeUnmount={handlePageTabSync}
                  />
                )}

                {activeTab === 'master' && (
                  <MasterTab masterData={masterData} onRefresh={fetchAllData} />
                )}

                {activeTab === 'pkr-opex' && (
                  <PKROpexTab
                    pkrOpex={pkrOpex}
                    setPkrOpex={setPkrOpex}
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