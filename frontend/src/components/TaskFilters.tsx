import React, { RefObject } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Project } from '../types/project';

interface TaskFiltersProps {
    searchTermRef: RefObject<HTMLInputElement>;
    searchTerm: string;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    projectId?: string;
    projectFilter: number | null;
    onProjectFilterChange: (projectId: number | null) => void;
    projects: Project[];
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
    typeFilter: string | null;
    onTypeFilterChange: (type: string | null) => void;
    pageSize: number;
    onPageSizeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    onFilterChange: () => void; // Callback to reset current page when any filter changes
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
    searchTermRef,
    searchTerm,
    onSearchChange,
    projectId,
    projectFilter,
    onProjectFilterChange,
    projects,
    statusFilter,
    onStatusFilterChange,
    typeFilter,
    onTypeFilterChange,
    pageSize,
    onPageSizeChange,
    onFilterChange
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const handleProjectFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        console.log('Project dropdown changed - value:', value, 'type:', typeof value);
        
        // Update URL params to sync with dropdown selection
        const newParams = new URLSearchParams(searchParams);
        if (value && value !== '') {
            const parsedValue = parseInt(value, 10);
            console.log('Setting projectFilter to:', parsedValue);
            onProjectFilterChange(isNaN(parsedValue) ? null : parsedValue);
            // Update URL to keep it in sync
            newParams.set('projectId', value);
        } else {
            console.log('Setting projectFilter to null');
            onProjectFilterChange(null);
            // Remove projectId from URL when clearing
            newParams.delete('projectId');
        }
        setSearchParams(newParams);
        onFilterChange();
    };

    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onStatusFilterChange(e.target.value);
        onFilterChange();
    };

    const handleTypeFilterChange = (type: string | null) => {
        onTypeFilterChange(type);
        onFilterChange();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Search Bar */}
                <div className="flex-1 w-full lg:w-auto">
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        ref={searchTermRef}
                        value={searchTerm}
                        onChange={onSearchChange}
                        className="w-full p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {!projectId && (
                        <select
                            value={projectFilter !== null ? projectFilter : (searchParams.get('projectId') || '')}
                            onChange={handleProjectFilterChange}
                            className="p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
                        >
                            <option value="">All Projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={String(project.id)}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    )}
                    
                    <select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                    >
                        <option value="all">All Status</option>
                        <option value="billed">Billed</option>
                        <option value="unbilled">Unbilled</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>

                    {/* Type Checkboxes */}
                    <div className="flex items-center gap-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={typeFilter === 'EVOLUTIVA'}
                                onChange={e => handleTypeFilterChange(e.target.checked ? 'EVOLUTIVA' : null)}
                                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Evolutiva</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={typeFilter === 'CORRETTIVA'}
                                onChange={e => handleTypeFilterChange(e.target.checked ? 'CORRETTIVA' : null)}
                                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Correttiva</span>
                        </label>
                    </div>

                    {/* Page Size */}
                    <div className="flex items-center gap-2 ml-auto lg:ml-0">
                        <label htmlFor="pageSizeSelect" className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Items per page:</label>
                        <select
                            id="pageSizeSelect"
                            value={pageSize}
                            onChange={onPageSizeChange}
                            className="p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskFilters;
