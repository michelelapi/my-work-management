import React, { RefObject, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Project, ProjectStatus } from '../types/project';

const ProjectStatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
    if (status === ProjectStatus.ACTIVE) {
        return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
            </span>
        );
    }

    if (status === ProjectStatus.COMPLETED) {
        return (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Completed
            </span>
        );
    }

    return (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {status.replace(/_/g, ' ')}
        </span>
    );
};

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
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
    const projectDropdownRef = useRef<HTMLDivElement>(null);
    const activeProjects = projects.filter(project => project.status === ProjectStatus.ACTIVE);
    const defaultProjectApplied = useRef(false);

    const selectedProjectValue = projectFilter !== null
        ? String(projectFilter)
        : (searchParams.get('projectId') || '');

    const selectedProject = projects.find(project => String(project.id) === selectedProjectValue);

    useEffect(() => {
        if (projectId || defaultProjectApplied.current) {
            return;
        }

        const urlProjectId = searchParams.get('projectId');
        if (urlProjectId || projectFilter !== null) {
            defaultProjectApplied.current = true;
            return;
        }

        if (activeProjects.length === 0) {
            return;
        }

        const firstActiveProjectId = activeProjects[0].id;
        if (firstActiveProjectId === undefined) {
            return;
        }

        defaultProjectApplied.current = true;
        onProjectFilterChange(firstActiveProjectId);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('projectId', String(firstActiveProjectId));
        setSearchParams(newParams);
        onFilterChange();
    }, [activeProjects, onFilterChange, onProjectFilterChange, projectFilter, projectId, searchParams, setSearchParams]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
                setProjectDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProjectFilterChange = (value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value && value !== '') {
            const parsedValue = parseInt(value, 10);
            onProjectFilterChange(isNaN(parsedValue) ? null : parsedValue);
            newParams.set('projectId', value);
        } else {
            onProjectFilterChange(null);
            newParams.delete('projectId');
        }
        setSearchParams(newParams);
        onFilterChange();
        setProjectDropdownOpen(false);
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
                        <div ref={projectDropdownRef} className="relative min-w-[220px]">
                            <button
                                type="button"
                                onClick={() => setProjectDropdownOpen(open => !open)}
                                className="w-full p-2.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between gap-2"
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <span className="truncate">
                                        {selectedProject ? selectedProject.name : 'All Projects'}
                                    </span>
                                    {selectedProject && <ProjectStatusBadge status={selectedProject.status} />}
                                </span>
                                <svg className="h-4 w-4 shrink-0 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {projectDropdownOpen && (
                                <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => handleProjectFilterChange('')}
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                                            selectedProjectValue === '' ? 'bg-gray-50 dark:bg-gray-600' : ''
                                        }`}
                                    >
                                        All Projects
                                    </button>
                                    {projects.map(project => (
                                        <button
                                            key={project.id}
                                            type="button"
                                            onClick={() => handleProjectFilterChange(String(project.id))}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between gap-2 ${
                                                selectedProjectValue === String(project.id) ? 'bg-gray-50 dark:bg-gray-600' : ''
                                            }`}
                                        >
                                            <span className="truncate text-gray-900 dark:text-white">{project.name}</span>
                                            <ProjectStatusBadge status={project.status} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
