import React from 'react';
import { Task } from '../types/task';
import { useSearchParams } from 'react-router-dom';

// Helper function to format numbers with thousands separators
const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

interface ProjectSummaryProps {
    allFilteredTasks: Task[];
    monthFilter: string | null;
    yearFilter: string | null;
    projectFilter: number | null;
    debouncedSearchTerm: string;
    statusFilter: string;
    typeFilter: string | null;
}

interface ProjectSummaryData {
    projectId: number;
    projectName: string;
    totalHours: number;
    totalAmount: number;
    currency: string;
    taskCount: number;
}

const ProjectSummary: React.FC<ProjectSummaryProps> = ({
    allFilteredTasks,
    monthFilter,
    yearFilter,
    projectFilter,
    debouncedSearchTerm,
    statusFilter,
    typeFilter
}) => {
    const [searchParams] = useSearchParams();

    // Calculate project summaries - group tasks by project and calculate totals
    const projectSummaries = allFilteredTasks.reduce((acc, task) => {
        const projectName = task.projectName || 'Unknown Project';
        const projectId = task.projectId || 0;
        const key = `${projectId}-${projectName}`;
        
        if (!acc[key]) {
            acc[key] = {
                projectId,
                projectName,
                totalHours: 0,
                totalAmount: 0,
                currency: task.currency || 'EUR',
                taskCount: 0
            };
        }
        
        acc[key].totalHours += task.hoursWorked || 0;
        acc[key].totalAmount += (task.hoursWorked || 0) * (task.rateUsed || 0);
        acc[key].taskCount += 1;
        
        return acc;
    }, {} as Record<string, ProjectSummaryData>);

    const projectSummaryArray = Object.values(projectSummaries).sort((a, b) => 
        b.totalAmount - a.totalAmount // Sort by total amount descending
    );

    // Determine if summary should be shown
    const urlMonth = searchParams.get('month');
    const urlYear = searchParams.get('year');
    const urlProjectId = searchParams.get('projectId');
    const hasActiveFilters = monthFilter || yearFilter || urlMonth || urlYear ||
                           projectFilter !== null || urlProjectId ||
                           debouncedSearchTerm || statusFilter !== 'all' || typeFilter !== null;
    
    const shouldShow = hasActiveFilters && allFilteredTasks.length > 0 && projectSummaryArray.length > 0;

    if (!shouldShow) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Project Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectSummaryArray.map((summary) => (
                    <div 
                        key={`${summary.projectId}-${summary.projectName}`}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                    >
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2 truncate" title={summary.projectName}>
                            {summary.projectName}
                        </h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Tasks:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{summary.taskCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatNumber(summary.totalHours)}h
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Total Amount:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {formatNumber(summary.totalAmount)} {summary.currency}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectSummary;
