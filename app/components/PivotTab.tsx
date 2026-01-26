'use client';

import React from 'react';

interface PivotTabProps {
  projects: any[];
  masterData: any;
}

export default function PivotTab({ projects, masterData }: PivotTabProps) {
  // Calculate priority counts
  const priorityCounts = masterData.prioritas.reduce((acc: any, priority: any) => {
    acc[priority.name] = projects.filter(p => p.prioritasId === priority.id).length;
    return acc;
  }, {});

  // Get all unique projects for the table
  const projectSummary = projects.map(project => ({
    code: project.code,
    partnership: project.namaCalonMitra,
    branch: project.branch?.name,
    latestUpdate: project.latestUpdate || '-',
    actionPlan: project.actionPlan || '-',
    latestActivity: project.latestActivity || '-',
    activityStatus: project.latestActivityStatus?.name || '-',
    progress: project.progressPercentage,
    prioritas: project.prioritas?.name,
  }));

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(priorityCounts).map(([priority, count]) => {
          const colors: Record<string, string> = {
            'Done': 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700',
            'High': 'bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700',
            'HOLD': 'bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600',
            'Low': 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700',
            'Medium': 'bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-700',
            'STOP': 'bg-black border-gray-800 dark:bg-gray-900 dark:border-gray-700',
            'Selesai': 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700',
          };
          
          return (
            <div
              key={priority}
              className={`p-4 rounded-lg border-2 ${colors[priority] || 'bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600'}`}
            >
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{priority}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{count as number}</p>
            </div>
          );
        })}
      </div>

      {/* Project Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 bg-blue-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sum of % Progress</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-blue-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Partnership</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Latest Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Action Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Latest Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Activity Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">% Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Prioritas</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {projectSummary.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No projects available for summary.
                  </td>
                </tr>
              ) : (
                projectSummary.map((project, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{project.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{project.partnership}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{project.branch}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{project.latestUpdate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{project.actionPlan}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{project.latestActivity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{project.activityStatus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{project.progress}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{project.prioritas}</td>
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