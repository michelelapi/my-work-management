import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Task } from '../types/task';
import { taskService, PageResponse } from '../services/taskService';
import { runReminderPreflightGate } from '../services/api';
import reminderService from '../services/reminderService';
import projectService from '../services/projectService';
import { Project } from '../types/project';
// import { FaPen, FaTrash } from 'react-icons/fa';
import { FaPen } from "@react-icons/all-files/fa/FaPen"
import { FaTrash } from "@react-icons/all-files/fa/FaTrash"
import { FaCheck } from "@react-icons/all-files/fa/FaCheck"
import { FaFilePdf } from "@react-icons/all-files/fa/FaFilePdf"
import { FaBell } from "@react-icons/all-files/fa/FaBell"
import { FaChevronDown } from "@react-icons/all-files/fa/FaChevronDown"
import { FaChevronUp } from "@react-icons/all-files/fa/FaChevronUp"
import ProjectSummary from '../components/ProjectSummary';
import TaskFilters from '../components/TaskFilters';
import TaskActionButtons from '../components/TaskActionButtons';
import BillingStatusModal from '../components/BillingStatusModal';
import PaymentStatusModal from '../components/PaymentStatusModal';
import InfoForBillModal from '../components/InfoForBillModal';
import GenerateSalModal from '../components/GenerateSalModal';
import PartialBillingModal from '../components/PartialBillingModal';
import PartialPaymentModal from '../components/PartialPaymentModal';
import { getBillingStatus } from '../utils/billingStatus';
import { getPaymentStatus } from '../utils/paymentStatus';

// Helper function to format numbers with thousands separators
const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const TaskListPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
    const [expandedStatusTaskIds, setExpandedStatusTaskIds] = useState<Set<number>>(new Set());
    const [allFilteredTasks, setAllFilteredTasks] = useState<Task[]>([]); // Store all filtered tasks for summary
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const searchTermRef = useRef<HTMLInputElement>(null);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10); // You can adjust default page size
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Billing status states
    const [billingStatusModalOpen, setBillingStatusModalOpen] = useState(false);
    const [billingModalTasks, setBillingModalTasks] = useState<Task[]>([]);
    const [billingUpdating, setBillingUpdating] = useState(false);
    const [partialBillingModalOpen, setPartialBillingModalOpen] = useState(false);
    const [taskForPartialBilling, setTaskForPartialBilling] = useState<Task | null>(null);
    const [partialBillingUpdating, setPartialBillingUpdating] = useState(false);
    const [selectedBillingStatus, setSelectedBillingStatus] = useState<boolean | null>(null);
    const [billingDate, setBillingDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [invoiceId, setInvoiceId] = useState<string>('');

    // Payment status states
    const [paymentStatusModalOpen, setPaymentStatusModalOpen] = useState(false);
    const [paymentModalTasks, setPaymentModalTasks] = useState<Task[]>([]);
    const [paymentUpdating, setPaymentUpdating] = useState(false);
    const [partialPaymentModalOpen, setPartialPaymentModalOpen] = useState(false);
    const [taskForPartialPayment, setTaskForPartialPayment] = useState<Task | null>(null);
    const [partialPaymentUpdating, setPartialPaymentUpdating] = useState(false);
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<boolean | null>(null);
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [paymentDates, setPaymentDates] = useState<string>('');

    // Invoice ID modal state for single task billing
    const [invoiceIdModalOpen, setInvoiceIdModalOpen] = useState(false);
    const [taskToBill, setTaskToBill] = useState<Task | null>(null);
    const [invoiceIdInput, setInvoiceIdInput] = useState<string>('');

    // Info For Bill modal state
    const [infoForBillModalOpen, setInfoForBillModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Generate SAL modal state
    const [salModalOpen, setSalModalOpen] = useState(false);
    const [salModalTasks, setSalModalTasks] = useState<Task[]>([]);
    const [salModalPeriod, setSalModalPeriod] = useState<{ year: number; month: number } | null>(null);
    const [salGenerating, setSalGenerating] = useState(false);

    // Type filter state
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    // Project filter state
    const [projectFilter, setProjectFilter] = useState<number | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeReminderActivities, setActiveReminderActivities] = useState<Set<string>>(new Set());

    // Date filter state from URL query params
    const [monthFilter, setMonthFilter] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<string | null>(null);

    // Debug: Log when filters change
    useEffect(() => {
        console.log('Filter state changed - monthFilter:', monthFilter, 'yearFilter:', yearFilter);
    }, [monthFilter, yearFilter]);

    // Status filter state
    const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'billed', 'unbilled', 'paid', 'unpaid'

    // Sort state - now using backend sorting
    const [sortField, setSortField] = useState<string>('startDate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');


    const selectedTasks = tasks.filter(task => task.id !== undefined && selectedTaskIds.has(task.id));
    const hasSelectedTasks = selectedTasks.length > 0;

    // Compute info for bill - group selected tasks by day
    const tasksByDay: Record<string, Task[]> = selectedTasks.reduce((acc, task) => {
        const date = task.startDate ? new Date(task.startDate).toLocaleDateString() : 'No Date';
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    const taskIdsString = selectedTasks.map(task => task.ticketId).filter(id => id).join(', ');
    const totalAmount = selectedTasks.reduce((sum, task) => sum + (task.hoursWorked * (task.rateUsed ?? 0)), 0);
    const totalHours = selectedTasks.reduce((sum, task) => sum + (task.hoursWorked || 0), 0);

    const handleCopy = (value: string, field: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 1000);
    };

    const toggleStatusDetails = (taskId: number) => {
        setExpandedStatusTaskIds((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    // Read URL query parameters on mount and when they change
    useEffect(() => {
        const month = searchParams.get('month');
        const year = searchParams.get('year');
        const projectIdParam = searchParams.get('projectId');
        
        console.log('Reading URL params - month:', month, 'year:', year, 'projectId:', projectIdParam);
        console.log('Full URL search params:', searchParams.toString());
        
        if (month) {
            console.log('Setting monthFilter to:', month);
            setMonthFilter(month);
        } else {
            console.log('Clearing monthFilter');
            setMonthFilter(null);
        }
        
        if (year) {
            console.log('Setting yearFilter to:', year);
            setYearFilter(year);
        } else {
            console.log('Clearing yearFilter');
            setYearFilter(null);
        }
        
        if (projectIdParam) {
            const parsedProjectId = parseInt(projectIdParam, 10);
            if (!isNaN(parsedProjectId)) {
                console.log('Setting projectFilter to:', parsedProjectId);
                setProjectFilter(parsedProjectId);
            } else {
                setProjectFilter(null);
            }
        } else {
            // Only clear projectFilter if we're not in a project-specific route
            if (!projectId) {
                setProjectFilter(null);
            }
        }
        
        // Reset to first page when filters change
        setCurrentPage(0);
    }, [searchParams, projectId]);

    // Fetch projects for filter
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const fetchedProjects = await projectService.getAllProjectsForUser();
                setProjects(fetchedProjects);
            } catch (err) {
                console.error('Error fetching projects:', err);
            }
        };
        fetchProjects();
    }, []);

    // Load active reminders to show bell indicators on action buttons
    useEffect(() => {
        const loadActiveReminderActivities = async () => {
            try {
                const reminders = await reminderService.getReminders(0, 200, 'creationDate,desc');
                setActiveReminderActivities(new Set(reminders.map((reminder) => reminder.activityName)));
            } catch (err) {
                console.error('Error loading reminders for action indicators:', err);
            }
        };

        const handleRemindersUpdated = () => {
            loadActiveReminderActivities();
        };

        loadActiveReminderActivities();
        window.addEventListener('reminders-updated', handleRemindersUpdated);

        return () => {
            window.removeEventListener('reminders-updated', handleRemindersUpdated);
        };
    }, []);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchTasks = async () => { 
            try {
                setLoading(true);
                
                // Determine project filter - prioritize manual selection (state) over URL params
                // This allows users to override the projectId from chart click by using the dropdown
                const urlProjectId = searchParams.get('projectId');
                let effectiveProjectId: number | undefined = undefined;
                
                // Priority: 1. Manual dropdown selection (projectFilter state), 2. Route param, 3. URL query param
                if (projectFilter !== null && projectFilter !== undefined) {
                    // User manually selected from dropdown - use that
                    effectiveProjectId = projectFilter;
                } else if (projectId) {
                    // Route parameter (e.g., /projects/:projectId/tasks)
                    const parsed = parseInt(projectId, 10);
                    if (!isNaN(parsed)) {
                        effectiveProjectId = parsed;
                    }
                } else if (urlProjectId) {
                    // URL query param from chart click
                    const parsed = parseInt(urlProjectId, 10);
                    if (!isNaN(parsed)) {
                        effectiveProjectId = parsed;
                    }
                }
                
                // Debug logging
                console.log('Fetch tasks - urlProjectId:', urlProjectId, 'projectFilter:', projectFilter, 'route projectId:', projectId, 'effectiveProjectId:', effectiveProjectId);
                
                // Determine status filters
                let isBilled: boolean | undefined = undefined;
                let isPaid: boolean | undefined = undefined;
                if (statusFilter === 'billed') {
                    isBilled = true;
                } else if (statusFilter === 'unbilled') {
                    isBilled = false;
                } else if (statusFilter === 'partially_billed') {
                    isBilled = false;
                } else if (statusFilter === 'paid') {
                    isPaid = true;
                } else if (statusFilter === 'unpaid') {
                    isPaid = false;
                } else if (statusFilter === 'partially_paid') {
                    isPaid = false;
                }
                
                // Build sort parameter
                const sortParam = `${sortField},${sortDirection}`;
                
                let response: PageResponse<Task>;
                let allTasks: Task[] = [];
                
                // Check URL params directly for date filters (in case state hasn't updated)
                const urlMonth = searchParams.get('month');
                const urlYear = searchParams.get('year');
                const hasDateFilter = monthFilter || yearFilter || urlMonth || urlYear;
                const needsFullFetch = hasDateFilter || statusFilter === 'partially_billed' || statusFilter === 'partially_paid';
                
                // If date filters are active, fetch ALL pages to ensure we get all matching tasks
                // Otherwise use normal pagination
                if (needsFullFetch) {
                    console.log('Date filter active - fetching all pages...', 'monthFilter:', monthFilter, 'yearFilter:', yearFilter, 'urlMonth:', urlMonth, 'urlYear:', urlYear);
                    // Fetch all pages
                    let page = 0;
                    let hasMore = true;
                    const pageSizeForFetch = 1000; // Reasonable page size for fetching all
                    
                    while (hasMore) {
                        console.log(`Fetching page ${page}...`);
                        const pageResponse = await taskService.getTasks(
                            effectiveProjectId,
                            page,
                            pageSizeForFetch,
                            debouncedSearchTerm,
                            isBilled,
                            isPaid,
                            sortParam,
                            typeFilter || undefined
                        );
                        
                        console.log(`Page ${page}: got ${pageResponse.content.length} tasks, totalPages: ${pageResponse.totalPages}`);
                        allTasks = allTasks.concat(pageResponse.content);
                        hasMore = page < pageResponse.totalPages - 1;
                        page++;
                        
                        // Safety limit to prevent infinite loops
                        if (page > 1000) {
                            console.warn('Reached safety limit of 1000 pages');
                            break;
                        }
                    }
                    
                    console.log('Fetched all pages - total tasks:', allTasks.length);
                    // Create a mock response for consistency
                    response = {
                        content: allTasks,
                        totalElements: allTasks.length,
                        totalPages: 1,
                        size: allTasks.length,
                        number: 0
                    };
                } else {
                    // Normal pagination
                    console.log('Calling getTasks with:', {
                        effectiveProjectId,
                        currentPage,
                        pageSize,
                        debouncedSearchTerm,
                        isBilled,
                        isPaid,
                        sortParam,
                        typeFilter
                    });
                    
                    response = await taskService.getTasks(
                        effectiveProjectId,
                        currentPage,
                        pageSize,
                        debouncedSearchTerm,
                        isBilled,
                        isPaid,
                        sortParam,
                        typeFilter || undefined
                    );
                }
                
                // Filter tasks by month/year if filters are set
                // Note: Backend filters (search, status, type, project) are already applied via API call above
                // We only need to apply date filtering on the frontend since backend doesn't support it
                // Use the same URL params we checked earlier
                const activeMonthFilter = monthFilter || urlMonth;
                const activeYearFilter = yearFilter || urlYear;
                
                let filteredTasks = response.content;
                console.log('Before date filtering - tasks count:', filteredTasks.length);
                console.log('Applied backend filters - search:', debouncedSearchTerm, 'status:', statusFilter, 'type:', typeFilter, 'project:', effectiveProjectId);
                console.log('Date filters - monthFilter:', monthFilter, 'yearFilter:', yearFilter);
                console.log('URL params - month:', urlMonth, 'year:', urlYear);
                console.log('Active date filters - month:', activeMonthFilter, 'year:', activeYearFilter);
                
                if (activeMonthFilter) {
                    // Filter by month (format: YYYY-MM)
                    const [year, month] = activeMonthFilter.split('-');
                    const targetYear = parseInt(year, 10);
                    const targetMonth = parseInt(month, 10);
                    console.log('Filtering by month - monthFilter:', monthFilter, 'targetYear:', targetYear, 'targetMonth:', targetMonth);
                    
                    // Sample a few task dates for debugging
                    if (filteredTasks.length > 0) {
                        console.log('Sample task dates (first 5):', filteredTasks.slice(0, 5).map(t => ({ id: t.id, startDate: t.startDate })));
                    }
                    
                    filteredTasks = filteredTasks.filter(task => {
                        if (!task.startDate) {
                            return false;
                        }
                        // Parse the date string directly (YYYY-MM-DD format from backend)
                        // Extract just the date part (YYYY-MM-DD) if there's a time component
                        const dateStr = task.startDate.split('T')[0]; // Remove time if present
                        const dateParts = dateStr.split('-');
                        if (dateParts.length !== 3) {
                            console.log('Invalid date format for task:', task.id, 'startDate:', task.startDate);
                            return false;
                        }
                        const taskYear = parseInt(dateParts[0], 10);
                        const taskMonth = parseInt(dateParts[1], 10);
                        
                        const matches = taskYear === targetYear && taskMonth === targetMonth;
                        if (matches) {
                            console.log('Task matches filter:', task.id, 'date:', task.startDate, 'parsed year:', taskYear, 'parsed month:', taskMonth);
                        }
                        return matches;
                    });
                    console.log('After month filtering - tasks count:', filteredTasks.length);
                    if (filteredTasks.length > 0) {
                        console.log('Sample filtered tasks (first 3):', filteredTasks.slice(0, 3).map(t => ({ id: t.id, startDate: t.startDate })));
                    } else {
                        console.warn('No tasks found matching month filter:', activeMonthFilter);
                        console.log('Sample of all task dates (first 10):', response.content.slice(0, 10).map(t => t.startDate));
                    }
                } else if (activeYearFilter) {
                    // Filter by year (format: YYYY)
                    const targetYear = parseInt(activeYearFilter, 10);
                    console.log('Filtering by year - targetYear:', targetYear);
                    
                    filteredTasks = filteredTasks.filter(task => {
                        if (!task.startDate) return false;
                        // Extract just the date part (YYYY-MM-DD) if there's a time component
                        const dateStr = task.startDate.split('T')[0];
                        const dateParts = dateStr.split('-');
                        if (dateParts.length !== 3) {
                            return false;
                        }
                        const taskYear = parseInt(dateParts[0], 10);
                        return taskYear === targetYear;
                    });
                    console.log('After year filtering - tasks count:', filteredTasks.length);
                }

                if (statusFilter === 'unbilled') {
                    filteredTasks = filteredTasks.filter(task => !task.isBilled && !task.isPartiallyBilled);
                } else if (statusFilter === 'partially_billed') {
                    filteredTasks = filteredTasks.filter(task => task.isPartiallyBilled);
                } else if (statusFilter === 'unpaid') {
                    filteredTasks = filteredTasks.filter(task => !task.isPaid && !task.isPartiallyPaid);
                } else if (statusFilter === 'partially_paid') {
                    filteredTasks = filteredTasks.filter(task => task.isPartiallyPaid);
                }
                
                // Apply pagination to filtered results if date filters are active
                if (activeMonthFilter || activeYearFilter || statusFilter === 'partially_billed' || statusFilter === 'partially_paid') {
                    // Store all filtered tasks for summary calculation (all pages)
                    setAllFilteredTasks(filteredTasks);
                    const startIndex = currentPage * pageSize;
                    const endIndex = startIndex + pageSize;
                    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
                    setTasks(paginatedTasks);
                    setTotalPages(Math.ceil(filteredTasks.length / pageSize));
                    setTotalElements(filteredTasks.length);
                } else {
                    // For normal pagination, we need to fetch all tasks if we want accurate summaries
                    // But only if filters are active (to avoid performance issues)
                    const hasActiveFilters = effectiveProjectId !== undefined || 
                                           debouncedSearchTerm || 
                                           statusFilter !== 'all' || 
                                           typeFilter !== null;
                    
                    if (hasActiveFilters) {
                        // Fetch all pages to get accurate summary
                        let allTasksForSummary: Task[] = [];
                        let page = 0;
                        let hasMore = true;
                        const pageSizeForSummary = 1000;
                        
                        while (hasMore) {
                            const summaryResponse = await taskService.getTasks(
                                effectiveProjectId,
                                page,
                                pageSizeForSummary,
                                debouncedSearchTerm,
                                isBilled,
                                isPaid,
                                sortParam,
                                typeFilter || undefined
                            );
                            
                            allTasksForSummary = allTasksForSummary.concat(summaryResponse.content);
                            hasMore = page < summaryResponse.totalPages - 1;
                            page++;
                            
                            if (page > 1000) break; // Safety limit
                        }
                        
                        setAllFilteredTasks(allTasksForSummary);
                    } else {
                        // No filters active, clear the summary
                        setAllFilteredTasks([]);
                    }
                    
                    setTasks(filteredTasks);
                    setTotalPages(response.totalPages);
                    setTotalElements(response.totalElements);
                }
        
            } catch (err) {
                setError('Failed to fetch tasks. Please try again later.');
                console.error('Error fetching tasks:', err);
            } finally {
                setLoading(false);        
            }
        };

        fetchTasks();

    }, [projectId, projectFilter, currentPage, pageSize, debouncedSearchTerm, typeFilter, statusFilter, sortField, sortDirection, monthFilter, yearFilter, searchParams]);

    useEffect(() => {
        if (searchTermRef.current && !loading) {
            searchTermRef.current.focus();
        }
    }, [loading, searchTerm]);

    useEffect(() => {
        // Keep selection synced with visible tasks.
        setSelectedTaskIds(prev => {
            const visibleIds = new Set(tasks.filter(task => task.id !== undefined).map(task => task.id as number));
            const next = new Set<number>();
            prev.forEach(id => {
                if (visibleIds.has(id)) {
                    next.add(id);
                }
            });
            return next;
        });
    }, [tasks]);

    const handleDelete = async (projectId: number, taskId: number) => {
        try {
                await taskService.deleteTask(projectId, taskId); 
                // After deletion, re-fetch tasks for the current page with current filters
                const response = await taskService.getTasks(
                    projectId ? projectId : undefined,
                    currentPage,
                    pageSize,
                    debouncedSearchTerm
                );
                setTasks(response.content);
                setTotalPages(response.totalPages);
                setTotalElements(response.totalElements);
                setDeleteModalOpen(false);
                setTaskToDelete(null);
        } catch (err) {
            setError('Failed to delete task. Please try again later.');
            console.error('Error deleting task:', err);
        }
    };

    const openDeleteModal = (task: Task) => {
        setTaskToDelete(task);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setTaskToDelete(null);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(parseInt(event.target.value));
        setCurrentPage(0); // Reset to first page when page size changes
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setCurrentPage(0); // Reset to first page when search term changes        
    };

    const handleFilterChange = () => {
        setCurrentPage(0); // Reset to first page when any filter changes
    };

    const handleCloseBillingStatusModal = () => {
        if (billingUpdating) return;
        setBillingStatusModalOpen(false);
        setBillingModalTasks([]);
        setSelectedBillingStatus(null);
        setBillingDate(new Date().toISOString().split('T')[0]);
        setInvoiceId('');
    };

    const handleClosePaymentStatusModal = () => {
        if (paymentUpdating) return;
        setPaymentStatusModalOpen(false);
        setPaymentModalTasks([]);
        setSelectedPaymentStatus(null);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentDates('');
    };

    const refreshCurrentTaskPage = async () => {
        const effectiveProjectId: number | undefined = projectId
            ? parseInt(projectId)
            : (projectFilter !== null && projectFilter !== undefined)
                ? projectFilter
                : undefined;

        let isBilled: boolean | undefined = undefined;
        let isPaid: boolean | undefined = undefined;
        if (statusFilter === 'billed') {
            isBilled = true;
        } else if (statusFilter === 'unbilled') {
            isBilled = false;
        } else if (statusFilter === 'paid') {
            isPaid = true;
        } else if (statusFilter === 'unpaid') {
            isPaid = false;
        }

        const sortParam = `${sortField},${sortDirection}`;
        const response = await taskService.getTasks(
            effectiveProjectId,
            currentPage,
            pageSize,
            debouncedSearchTerm,
            isBilled,
            isPaid,
            sortParam,
            typeFilter || undefined
        );

        setTasks(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
    };

    const handleBillingStatusUpdate = async (orderedTasks: Task[]) => {
        if (selectedBillingStatus === null) return;
        if (orderedTasks.length === 0) return;

        try {
            setBillingUpdating(true);
            const taskUpdates = orderedTasks.map(task => ({
                taskId: task.id!,
                isBilled: selectedBillingStatus,
                billingDate: billingDate,
                invoiceId: invoiceId
            }));

            await taskService.updateTasksBillingStatus(taskUpdates);
            
            await refreshCurrentTaskPage();
            
            setBillingStatusModalOpen(false);
            setBillingModalTasks([]);
            setSelectedBillingStatus(null);
            setBillingDate(new Date().toISOString().split('T')[0]);
            setInvoiceId('');
        } catch (err) {
            setError('Failed to update billing status. Please try again later.');
            console.error('Error updating billing status:', err);
        } finally {
            setBillingUpdating(false);
        }
    };

    const handlePaymentStatusUpdate = async () => {
        if (selectedPaymentStatus === null) return;
        if (paymentModalTasks.length === 0) return;

        try {
            setPaymentUpdating(true);
            const taskUpdates = paymentModalTasks.map(task => ({
                taskId: task.id!,
                isPaid: selectedPaymentStatus,
                paymentDate: paymentDate,
                ...(paymentDates.trim() ? { paymentDates: paymentDates.trim() } : {})
            }));

            await taskService.updateTasksPaymentStatus(taskUpdates);
            await refreshCurrentTaskPage();
            setPaymentStatusModalOpen(false);
            setPaymentModalTasks([]);
            setSelectedPaymentStatus(null);
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setPaymentDates('');
        } catch (err) {
            setError('Failed to update payment status. Please try again later.');
            console.error('Error updating payment status:', err);
        } finally {
            setPaymentUpdating(false);
        }
    };

    const handleClosePartialPaymentModal = () => {
        if (partialPaymentUpdating) return;
        setPartialPaymentModalOpen(false);
        setTaskForPartialPayment(null);
    };

    const handlePartialPaymentUpdate = async (taskId: number, paymentDateValue: string) => {
        try {
            setPartialPaymentUpdating(true);
            await taskService.payNextPartialPortion(taskId, paymentDateValue);
            await refreshCurrentTaskPage();
            setPartialPaymentModalOpen(false);
            setTaskForPartialPayment(null);
        } catch (err) {
            setError('Failed to pay the remaining portion. Please try again later.');
            console.error('Error paying partial portion:', err);
        } finally {
            setPartialPaymentUpdating(false);
        }
    };

    const handleToggleBillingStatus = async (task: Task) => {
        if (!task.id) return;

        const billingStatus = getBillingStatus(task);

        if (billingStatus === 'billed') {
            await performBillingStatusUpdate(task, false, '', new Date().toISOString().split('T')[0]);
            return;
        }

        if (billingStatus === 'partially_billed') {
            setTaskForPartialBilling(task);
            setPartialBillingModalOpen(true);
            return;
        }

        // If billing, check localStorage first
        if (!task.projectId) {
            // If no projectId, show modal
            setTaskToBill(task);
            setInvoiceIdInput(task.invoiceId || '');
            setInvoiceIdModalOpen(true);
            return;
        }

        const taskDate = new Date(task.startDate);
        const monthYear = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}`;
        const storageKey = `invoiceId_${monthYear}_${task.projectId}`;
        const storedInvoiceId = localStorage.getItem(storageKey);

        if (storedInvoiceId) {
            // Use stored invoiceId without showing modal
            await performBillingStatusUpdate(task, true, storedInvoiceId, new Date().toISOString().split('T')[0]);
        } else {
            // Show modal to enter invoiceId
            setTaskToBill(task);
            setInvoiceIdInput(task.invoiceId || '');
            setInvoiceIdModalOpen(true);
        }
    };

    const handleClosePartialBillingModal = () => {
        if (partialBillingUpdating) return;
        setPartialBillingModalOpen(false);
        setTaskForPartialBilling(null);
    };

    const handlePartialBillingUpdate = async (taskId: number, invoiceId: string, billingDate: string) => {
        try {
            setPartialBillingUpdating(true);
            await taskService.billNextPartialPortion(taskId, invoiceId, billingDate);
            await refreshCurrentTaskPage();
            setPartialBillingModalOpen(false);
            setTaskForPartialBilling(null);
        } catch (err) {
            setError('Failed to bill the remaining portion. Please try again later.');
            console.error('Error billing partial portion:', err);
        } finally {
            setPartialBillingUpdating(false);
        }
    };

    const performBillingStatusUpdate = async (task: Task, isBilled: boolean, invoiceId: string, billingDate: string) => {
        if (!task.id) return;

        try {
            // Always send a valid date - backend will ignore it if isBilled is false
            const billingDateToSend = isBilled 
                ? billingDate
                : (task.billingDate || new Date().toISOString().split('T')[0]);
            
            const taskUpdate = [{
                taskId: task.id,
                isBilled: isBilled,
                billingDate: billingDateToSend,
                invoiceId: isBilled ? invoiceId : ''
            }];

            await taskService.updateTasksBillingStatus(taskUpdate);
            
            // If billing, store invoiceId in localStorage
            if (isBilled && invoiceId && task.projectId) {
                const taskDate = new Date(task.startDate);
                const monthYear = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}`;
                const storageKey = `invoiceId_${monthYear}_${task.projectId}`;
                localStorage.setItem(storageKey, invoiceId);
            }
            
            // Refresh the task list
            const effectiveProjectId: number | undefined = projectId 
                ? parseInt(projectId) 
                : (projectFilter !== null && projectFilter !== undefined) 
                    ? projectFilter 
                    : undefined;
            
            let isBilledFilter: boolean | undefined = undefined;
            let isPaid: boolean | undefined = undefined;
            if (statusFilter === 'billed') {
                isBilledFilter = true;
            } else if (statusFilter === 'unbilled') {
                isBilledFilter = false;
            } else if (statusFilter === 'paid') {
                isPaid = true;
            } else if (statusFilter === 'unpaid') {
                isPaid = false;
            }
            
            const sortParam = `${sortField},${sortDirection}`;
            
            const response = await taskService.getTasks(
                effectiveProjectId,
                currentPage,
                pageSize,
                debouncedSearchTerm,
                isBilledFilter,
                isPaid,
                sortParam,
                typeFilter || undefined
            );
            setTasks(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (err) {
            setError('Failed to update billing status. Please try again later.');
            console.error('Error updating billing status:', err);
        }
    };

    const handleInvoiceIdSubmit = async () => {
        if (!taskToBill || !invoiceIdInput.trim()) {
            setError('Please enter an invoice ID');
            return;
        }

        setInvoiceIdModalOpen(false);
        await performBillingStatusUpdate(
            taskToBill, 
            true, 
            invoiceIdInput.trim(), 
            new Date().toISOString().split('T')[0]
        );
        setTaskToBill(null);
        setInvoiceIdInput('');
    };

    const handleTogglePaymentStatus = async (task: Task) => {
        if (!task.id) return;

        const paymentStatus = getPaymentStatus(task);

        if (paymentStatus === 'paid') {
            try {
                await taskService.updateTasksPaymentStatus([{
                    taskId: task.id,
                    isPaid: false,
                    paymentDate: task.paymentDate || new Date().toISOString().split('T')[0]
                }]);
                await refreshCurrentTaskPage();
            } catch (err) {
                setError('Failed to update payment status. Please try again later.');
                console.error('Error updating payment status:', err);
            }
            return;
        }

        if (paymentStatus === 'partially_paid') {
            try {
                const freshTask = await taskService.getTask(task.id);
                setTaskForPartialPayment(freshTask);
                setPartialPaymentModalOpen(true);
            } catch (err) {
                setError('Failed to load task details. Please try again later.');
                console.error('Error loading task for partial payment:', err);
            }
            return;
        }

        try {
            await taskService.updateTasksPaymentStatus([{
                taskId: task.id,
                isPaid: true,
                paymentDate: new Date().toISOString().split('T')[0]
            }]);
            await refreshCurrentTaskPage();
        } catch (err) {
            setError('Failed to update payment status. Please try again later.');
            console.error('Error updating payment status:', err);
        }
    };

    // Sorting handler - now triggers backend sorting
    const handleSort = (field: string) => {
        if (sortField === field) {
            // Toggle direction
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(0); // Reset to first page when sorting changes
    };

    const handleTaskSelectionChange = (taskId: number, checked: boolean) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (checked) {
                next.add(taskId);
            } else {
                next.delete(taskId);
            }
            return next;
        });
    };

    const handleSelectAllVisible = (checked: boolean) => {
        const visibleTaskIds = tasks.filter(task => task.id !== undefined).map(task => task.id as number);
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (checked) {
                visibleTaskIds.forEach(id => next.add(id));
            } else {
                visibleTaskIds.forEach(id => next.delete(id));
            }
            return next;
        });
    };

    const handleCreateNewTask = async () => {
        const createTaskPath = projectId ? `/projects/${projectId}/tasks` : '/projects/1/tasks';
        const shouldProceed = await runReminderPreflightGate('POST', createTaskPath);
        if (!shouldProceed) {
            return;
        }
        navigate('/tasks/new');
    };

    const resolveSalPeriod = (): { year: number; month: number } | null => {
        if (monthFilter) {
            const [filterYear, filterMonth] = monthFilter.split('-');
            const year = parseInt(filterYear, 10);
            const month = parseInt(filterMonth, 10);
            if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
                setError('Invalid date filter. Please use a valid month filter (YYYY-MM) or set a year filter.');
                return null;
            }
            return { year, month };
        }
        if (yearFilter) {
            const year = parseInt(yearFilter, 10);
            if (isNaN(year)) {
                setError('Invalid year filter. Please use a valid year.');
                return null;
            }
            return { year, month: new Date().getMonth() + 1 };
        }
        const tasksWithDates = (allFilteredTasks.length > 0 ? allFilteredTasks : tasks)
            .filter(t => t.startDate)
            .map(t => {
                const date = new Date(t.startDate);
                return { year: date.getFullYear(), month: date.getMonth() + 1 };
            });
        if (tasksWithDates.length > 0) {
            return tasksWithDates[0];
        }
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    };

    const resolveActionCandidateTasks = (): Task[] => {
        if (selectedTaskIds.size > 0) {
            const source = allFilteredTasks.length > 0 ? allFilteredTasks : tasks;
            return source.filter(t => t.id !== undefined && selectedTaskIds.has(t.id));
        }
        if (allFilteredTasks.length > 0) {
            return [...allFilteredTasks];
        }
        return [...tasks];
    };

    const downloadSalBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleGenerateSal = async () => {
        try {
            if (allFilteredTasks.length === 0 && tasks.length === 0) {
                setError('No tasks available to generate SAL PDF. Please filter tasks first.');
                return;
            }

            const period = resolveSalPeriod();
            if (!period) return;

            const candidateTasks = resolveActionCandidateTasks();
            if (candidateTasks.length === 0) {
                setError('No tasks available to generate SAL PDF. Please filter tasks first.');
                return;
            }

            const shouldProceed = await runReminderPreflightGate('GET', '/tasks/sal/pdf');
            if (!shouldProceed) {
                return;
            }

            setSalModalTasks(candidateTasks);
            setSalModalPeriod(period);
            setSalModalOpen(true);
        } catch (err: any) {
            console.error('Error opening SAL modal:', err);
            setError('Failed to prepare SAL generation. Please try again.');
        }
    };

    const handleSalModalGenerate = async (orderedTaskIds: number[]) => {
        if (!salModalPeriod) return;

        try {
            setSalGenerating(true);
            const result = await taskService.generateSalPdf(
                salModalPeriod.year,
                salModalPeriod.month,
                projectFilter || (projectId ? parseInt(projectId) : undefined),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                orderedTaskIds
            );
            downloadSalBlob(result.blob, result.filename);
            setSalModalOpen(false);
        } catch (err: any) {
            console.error('Error generating SAL PDF:', err);
            if (err.response) {
                if (err.response.status === 400) {
                    setError('No tasks found for the selected period. Please check your filters and ensure there are tasks for the selected year/month.');
                } else if (err.response.status === 401) {
                    setError('Unauthorized. Please log in again.');
                } else if (err.response.status === 500) {
                    setError('Server error while generating SAL PDF. Please try again later.');
                } else {
                    setError(`Failed to generate SAL PDF: ${err.response.statusText || 'Unknown error'}`);
                }
            } else {
                setError('Failed to generate SAL PDF. Please check your connection and try again.');
            }
        } finally {
            setSalGenerating(false);
        }
    };

    // Use tasks directly (already sorted by backend)
    const sortedTasks = tasks;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-3" role="alert">
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Delete Confirmation Modal */}
            {deleteModalOpen && taskToDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                                <svg className="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">Delete Task</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Are you sure you want to delete the task "{taskToDelete.title}"? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={closeDeleteModal}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(taskToDelete.projectId!, taskToDelete.id!)}
                                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice ID Modal for Single Task Billing */}
            {invoiceIdModalOpen && taskToBill && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                                <FaCheck className="h-6 w-6 text-green-600 dark:text-green-200" />
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-2">
                                Enter Invoice ID
                            </h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Please enter the invoice ID for task #{taskToBill.ticketId || taskToBill.id}
                                </p>
                                <div className="flex flex-col items-center space-y-2">
                                    <label htmlFor="invoiceIdInput" className="text-sm text-gray-600 dark:text-gray-400">
                                        Invoice ID
                                    </label>
                                    <input
                                        type="text"
                                        id="invoiceIdInput"
                                        value={invoiceIdInput}
                                        onChange={(e) => setInvoiceIdInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleInvoiceIdSubmit();
                                            }
                                        }}
                                        placeholder="Enter invoice ID"
                                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center space-x-4 mt-4">
                                <button
                                    onClick={() => {
                                        setInvoiceIdModalOpen(false);
                                        setTaskToBill(null);
                                        setInvoiceIdInput('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInvoiceIdSubmit}
                                    disabled={!invoiceIdInput.trim()}
                                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="mb-6">
                {(monthFilter || yearFilter) && (
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Filtered by: 
                        </span>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                            {monthFilter 
                                ? new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                : yearFilter + ' (Year)'}
                        </span>
                        <button
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                newParams.delete('month');
                                newParams.delete('year');
                                newParams.delete('projectId');
                                setSearchParams(newParams);
                                setMonthFilter(null);
                                setYearFilter(null);
                                setProjectFilter(null);
                            }}
                            className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {/* All Buttons in One Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    {/* Action Buttons Group - Left Side */}
                    <TaskActionButtons
                        onBillingStatusClick={async () => {
                            const candidateTasks = resolveActionCandidateTasks();
                            if (candidateTasks.length === 0) {
                                window.alert('No tasks available. Please filter tasks or select at least one task first.');
                                return;
                            }
                            const shouldProceed = await runReminderPreflightGate('PUT', '/tasks/billing-status');
                            if (!shouldProceed) {
                                return;
                            }
                            setBillingModalTasks(candidateTasks);
                            setBillingStatusModalOpen(true);
                        }}
                        onPaymentStatusClick={async () => {
                            const candidateTasks = resolveActionCandidateTasks();
                            if (candidateTasks.length === 0) {
                                window.alert('No tasks available. Please filter tasks or select at least one task first.');
                                return;
                            }
                            const shouldProceed = await runReminderPreflightGate('PUT', '/tasks/payment-status');
                            if (!shouldProceed) {
                                return;
                            }
                            setPaymentModalTasks(candidateTasks);
                            setPaymentStatusModalOpen(true);
                        }}
                        onInfoForBillClick={async () => {
                            if (!hasSelectedTasks) {
                                window.alert('Select at least one task first.');
                                return;
                            }
                            const infoForBillPath = projectId ? `/projects/${projectId}/tasks` : '/tasks';
                            const shouldProceed = await runReminderPreflightGate('GET', infoForBillPath);
                            if (!shouldProceed) {
                                return;
                            }
                            setInfoForBillModalOpen(true);
                        }}
                        onGenerateSalClick={handleGenerateSal}
                        hasBillingStatusReminder={activeReminderActivities.has('Update Billing Status')}
                        hasPaymentStatusReminder={activeReminderActivities.has('Update Payment Status')}
                        hasInfoForBillReminder={activeReminderActivities.has('Info For Bill')}
                        hasGenerateSalReminder={activeReminderActivities.has('Generate SAL')}
                    />

                    {/* Add New Task Button - Right Side */}
                    <button
                        onClick={handleCreateNewTask}
                        className="relative bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-md transition-colors font-medium shadow-md hover:shadow-lg flex items-center"
                    >
                        {activeReminderActivities.has('Create New Task') && (
                            <span
                                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-sm"
                                title="Active reminder"
                            >
                                <FaBell className="text-white text-[10px]" />
                            </span>
                        )}
                        Create New Task
                    </button>
                </div>
            </div>

            {/* Billing Status Update Modal */}
            <BillingStatusModal
                isOpen={billingStatusModalOpen}
                tasks={billingModalTasks}
                selectedBillingStatus={selectedBillingStatus}
                onBillingStatusChange={setSelectedBillingStatus}
                billingDate={billingDate}
                onBillingDateChange={setBillingDate}
                invoiceId={invoiceId}
                onInvoiceIdChange={setInvoiceId}
                updating={billingUpdating}
                onClose={handleCloseBillingStatusModal}
                onUpdate={handleBillingStatusUpdate}
            />

            <PartialBillingModal
                isOpen={partialBillingModalOpen}
                task={taskForPartialBilling}
                updating={partialBillingUpdating}
                onClose={handleClosePartialBillingModal}
                onUpdate={handlePartialBillingUpdate}
            />

            {/* Payment Status Update Modal */}
            <PaymentStatusModal
                isOpen={paymentStatusModalOpen}
                taskCount={paymentModalTasks.length}
                selectedPaymentStatus={selectedPaymentStatus}
                onPaymentStatusChange={setSelectedPaymentStatus}
                paymentDate={paymentDate}
                onPaymentDateChange={setPaymentDate}
                paymentDates={paymentDates}
                onPaymentDatesChange={setPaymentDates}
                updating={paymentUpdating}
                onClose={handleClosePaymentStatusModal}
                onUpdate={handlePaymentStatusUpdate}
            />

            <PartialPaymentModal
                isOpen={partialPaymentModalOpen}
                task={taskForPartialPayment}
                updating={partialPaymentUpdating}
                onClose={handleClosePartialPaymentModal}
                onUpdate={handlePartialPaymentUpdate}
            />

            {/* Info For Bill Modal */}
            <InfoForBillModal
                isOpen={infoForBillModalOpen}
                tasksByDay={tasksByDay}
                totalHours={totalHours}
                taskIdsString={taskIdsString}
                totalAmount={totalAmount}
                copiedField={copiedField}
                onCopy={handleCopy}
                onClose={() => setInfoForBillModalOpen(false)}
            />

            {/* Generate SAL Modal */}
            <GenerateSalModal
                isOpen={salModalOpen}
                tasks={salModalTasks}
                year={salModalPeriod?.year ?? new Date().getFullYear()}
                month={salModalPeriod?.month ?? new Date().getMonth() + 1}
                generating={salGenerating}
                onClose={() => !salGenerating && setSalModalOpen(false)}
                onGenerate={handleSalModalGenerate}
            />

            {/* Filter Section */}
            <TaskFilters
                searchTermRef={searchTermRef}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                projectId={projectId}
                projectFilter={projectFilter}
                onProjectFilterChange={setProjectFilter}
                projects={projects}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                onFilterChange={handleFilterChange}
            />

            {/* Project Summary Section */}
            <ProjectSummary
                allFilteredTasks={allFilteredTasks}
                monthFilter={monthFilter}
                yearFilter={yearFilter}
                projectFilter={projectFilter}
                debouncedSearchTerm={debouncedSearchTerm}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
            />

            {tasks.length === 0 && !loading ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                    No tasks found.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg mb-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all tasks"
                                        checked={tasks.length > 0 && selectedTasks.length === tasks.filter(task => task.id !== undefined).length}
                                        onChange={(e) => handleSelectAllVisible(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12 cursor-pointer" onClick={() => handleSort('ticketId')}>
                                    Task ID {sortField === 'ticketId' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-3/12 cursor-pointer" onClick={() => handleSort('title')}>
                                    Title {sortField === 'title' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/12">
                                    Project
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12 cursor-pointer" onClick={() => handleSort('startDate')}>
                                    Start Date {sortField === 'startDate' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12 cursor-pointer" onClick={() => handleSort('hoursWorked')}>
                                    Hours {sortField === 'hoursWorked' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12 cursor-pointer" onClick={() => handleSort('type')}>
                                    Type {sortField === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/12 cursor-pointer" onClick={() => handleSort('isBilled')}>
                                    Status {sortField === 'isBilled' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-3 py-4 text-center w-1/12">
                                        <input
                                            type="checkbox"
                                            aria-label={`Select task ${task.ticketId || task.id}`}
                                            checked={task.id !== undefined && selectedTaskIds.has(task.id)}
                                            onChange={(e) => {
                                                if (task.id !== undefined) {
                                                    handleTaskSelectionChange(task.id, e.target.checked);
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{task.ticketId}</div>
                                    </td>
                                    <td className="px-6 py-4 w-3/12 max-w-0">
                                        <div 
                                            className="text-sm text-gray-900 dark:text-white truncate"
                                            title={task.title}
                                        >
                                            {task.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-2/12">
                                        <div className="text-sm text-gray-900 dark:text-white">{task.projectName}</div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {new Date(task.startDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {task.hoursWorked} h
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 break-words w-1/12">
                                        <div className="text-sm text-gray-500 dark:text-gray-300">
                                            {task.type || '-'}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 break-words w-2/12">
                                        <div className="flex flex-col gap-1.5 min-w-[7.5rem]">
                                            <div className="grid grid-cols-2 gap-1 items-start">
                                                <span 
                                                    onClick={() => handleToggleBillingStatus(task)}
                                                    className={`px-1.5 py-0.5 flex text-center justify-center text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${
                                                        getBillingStatus(task) === 'partially_billed'
                                                            ? 'w-full leading-tight whitespace-normal rounded-md'
                                                            : 'whitespace-nowrap rounded-full'
                                                    } ${
                                                        getBillingStatus(task) === 'billed'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : getBillingStatus(task) === 'partially_billed'
                                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    }`}
                                                    title={
                                                        getBillingStatus(task) === 'partially_billed'
                                                            ? 'Click to bill the remaining portion'
                                                            : 'Click to toggle billing status'
                                                    }
                                                >
                                                    {getBillingStatus(task) === 'billed'
                                                        ? 'Billed'
                                                        : getBillingStatus(task) === 'partially_billed'
                                                        ? 'Partially Billed'
                                                        : 'Unbilled'}
                                                </span>
                                                <span 
                                                    onClick={() => handleTogglePaymentStatus(task)}
                                                    className={`px-1.5 py-0.5 flex text-center justify-center text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${
                                                        getPaymentStatus(task) === 'partially_paid'
                                                            ? 'w-full leading-tight whitespace-normal rounded-md'
                                                            : 'whitespace-nowrap rounded-full'
                                                    } ${
                                                        getPaymentStatus(task) === 'paid'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : getPaymentStatus(task) === 'partially_paid'
                                                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    }`}
                                                    title={
                                                        getPaymentStatus(task) === 'partially_paid'
                                                            ? 'Click to pay the remaining portion'
                                                            : 'Click to toggle payment status'
                                                    }
                                                >
                                                    {getPaymentStatus(task) === 'paid'
                                                        ? 'Paid'
                                                        : getPaymentStatus(task) === 'partially_paid'
                                                        ? 'Partially Paid'
                                                        : 'Unpaid'}
                                                </span>
                                            </div>
                                            {(task.isBilled || task.isPartiallyBilled || task.isPaid || task.isPartiallyPaid) && task.contractUsages && task.contractUsages.length > 0 && task.id !== undefined && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStatusDetails(task.id!)}
                                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-fit"
                                                        aria-expanded={expandedStatusTaskIds.has(task.id)}
                                                        aria-label={expandedStatusTaskIds.has(task.id) ? 'Hide billing details' : 'Show billing details'}
                                                    >
                                                        {expandedStatusTaskIds.has(task.id)
                                                            ? <FaChevronUp size={10} className="shrink-0" />
                                                            : <FaChevronDown size={10} className="shrink-0" />}
                                                        <span>
                                                            {task.contractUsages.length} contract{task.contractUsages.length > 1 ? 's' : ''}
                                                        </span>
                                                    </button>
                                                    {expandedStatusTaskIds.has(task.id) && (
                                                        <div className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-2 space-y-1.5">
                                                            {task.contractUsages.map((cu, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="text-xs border-b border-gray-200 dark:border-gray-600 last:border-0 last:pb-0 pb-1.5"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
                                                                            {cu.contractCode}
                                                                        </span>
                                                                        <span className="text-gray-600 dark:text-gray-300 tabular-nums">
                                                                            {cu.amountUsed.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                                            cu.invoiceId
                                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                                                        }`}>
                                                                            {cu.invoiceId ? `Inv. ${cu.invoiceId}` : 'Bill pending'}
                                                                        </span>
                                                                        {(cu.isBilled || cu.invoiceId) && (
                                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                                                cu.paymentDate
                                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                                                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                                                            }`}>
                                                                                {cu.paymentDate
                                                                                    ? `Paid ${cu.paymentDate.split('T')[0]}`
                                                                                    : 'Pay pending'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium break-words w-1/12">
                                        <button
                                            onClick={() => {
                                                if (task.projectId) {
                                                    navigate(`/companies/${task.projectId}/projects/${task.projectId}/tasks/${task.id}/edit`);
                                                }
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                            title="Edit"
                                        >
                                            <FaPen size={16} className="inline-block" />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(task)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            title="Delete"
                                        >
                                            <FaTrash size={16} className="inline-block" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Previous
                    </button>
                    <span className="text-gray-700 dark:text-gray-300">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskListPage;