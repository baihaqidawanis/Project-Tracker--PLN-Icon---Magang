'use client';

import React, { useState } from 'react';

interface ReportTabProps {
  projects: any[];
  masterData: any;
}

export default function ReportTab({ projects, masterData }: ReportTabProps) {
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterPIC, setFilterPIC] = useState('all');
  const [filterKode, setFilterKode] = useState('all');

  // Apply filters
  const filteredProjects = projects.filter(project => {
    const matchesPriority = filterPriority === 'all' || project.prioritasId === parseInt(filterPriority);
    const matchesBranch = filterBranch === 'all' || project.branchId === parseInt(filterBranch);
    const matchesPIC = filterPIC === 'all' || project.picId === parseInt(filterPIC);
    const matchesKode = filterKode === 'all' || project.kode === filterKode;
    return matchesPriority && matchesBranch && matchesPIC && matchesKode;
  });

  // Calculate priority distribution for chart
  const priorityCounts = masterData.prioritas.reduce((acc: any, priority: any) => {
    acc[priority.name] = filteredProjects.filter((p: any) => p.prioritasId === priority.id).length;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(priorityCounts).map(v => v as number), 1);

  return (
    <div>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prioritas</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All</option>
              {masterData.prioritas.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kode</label>
            <select
              value={filterKode}
              onChange={(e) => setFilterKode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All</option>
              {masterData.kodes.map((k: any) => <option key={k.id} value={k.name}>{k.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All</option>
              {masterData.branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">PIC</label>
            <select
              value={filterPIC}
              onChange={(e) => setFilterPIC(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">All</option>
              {masterData.pics.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Prioritas Distribution</h3>
        <div className="space-y-4">
          {Object.entries(priorityCounts).map(([priority, count]) => {
            const countNum = count as number;
            const percentage = maxCount > 0 ? (countNum / maxCount) * 100 : 0;
            const colors: Record<string, string> = {
              'Done': 'bg-green-500 dark:bg-green-600',
              'High': 'bg-red-500 dark:bg-red-600',
              'HOLD': 'bg-gray-500 dark:bg-gray-600',
              'Low': 'bg-yellow-500 dark:bg-yellow-600',
              'Medium': 'bg-orange-500 dark:bg-orange-600',
              'STOP': 'bg-black dark:bg-gray-800',
              'Selesai': 'bg-blue-500 dark:bg-blue-600',
            };
            
            return (
              <div key={priority}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{priority}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{countNum} projects</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                  <div
                    className={`h-8 rounded-full transition-all duration-500 flex items-center justify-center ${colors[priority] || 'bg-gray-500'}`}
                    style={{ width: `${percentage}%`, minWidth: countNum > 0 ? '40px' : '0' }}
                  >
                    {countNum > 0 && <span className="text-white text-sm font-bold">{countNum}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-blue-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nama Calon Mitra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Latest Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Action Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Latest Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Activity Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">% Progress</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No projects match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{project.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{project.branch?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{project.namaCalonMitra}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{project.latestUpdate || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{project.actionPlan || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{project.latestActivity || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{project.latestActivityStatus?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{project.progressPercentage}%</td>
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