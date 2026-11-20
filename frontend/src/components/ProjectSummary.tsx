import React, { useEffect, useMemo, useState } from 'react';
import { Task } from '../types/task';
import { useSearchParams } from 'react-router-dom';
import { FaChevronDown } from '@react-icons/all-files/fa/FaChevronDown';
import { FaChevronUp } from '@react-icons/all-files/fa/FaChevronUp';
import contractService from '../services/contractService';
import Tooltip from './Tooltip';

// Helper function to format numbers with thousands separators
const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const formatCurrencyAmount = (amount: number, currency: string): string => {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${formatNumber(amount)}`;
};

const formatDate = (value?: string): string => {
    if (!value) return '—';
    return value.split('T')[0];
};

const formatAvailableAmount = (value: number): string => {
    if (Math.abs(value) >= 1000) {
        const thousands = value / 1000;
        const formatted = thousands.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        });
        return `${formatted}k`;
    }
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
    });
};

interface ContractAvailability {
    amountAvailable: number;
    totalAmount: number;
}

const ContractAmountBlock: React.FC<{ availability?: ContractAvailability }> = ({ availability }) => {
    if (!availability || availability.totalAmount <= 0) {
        return null;
    }

    const availablePercent = Math.min(
        Math.max((availability.amountAvailable / availability.totalAmount) * 100, 0),
        100
    );
    const usedPercent = 100 - availablePercent;
    const barColor = usedPercent > 90 ? 'bg-red-500' : usedPercent > 70 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="flex justify-between items-center gap-3 mb-1">
            <span className="text-gray-600 dark:text-gray-400 shrink-0">
                Contract amount:
            </span>
            <div className="relative flex-1 min-w-0 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-5 overflow-hidden">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
                    style={{ width: `${availablePercent}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-2 text-[11px] font-bold pointer-events-none">
                    <span className="text-gray-900">0</span>
                    <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                        {formatAvailableAmount(availability.totalAmount)}
                    </span>
                </div>
                <div
                    className="absolute inset-y-0 flex items-center pl-1 text-[11px] font-bold text-amber-300 pointer-events-none whitespace-nowrap"
                    style={{ left: `${availablePercent}%` }}
                >
                    {formatAvailableAmount(availability.amountAvailable)}
                </div>
            </div>
        </div>
    );
};

const getTaskAmount = (task: Task): number => (task.hoursWorked || 0) * (task.rateUsed || 0);

const isUsageUnbilled = (invoiceId?: string): boolean => !invoiceId || invoiceId.trim() === '';

const isUsageBilledUnpaid = (invoiceId?: string, paymentDate?: string): boolean =>
    !isUsageUnbilled(invoiceId) && !paymentDate;

const amountToHours = (amount: number, rate?: number): number => {
    if (!rate || rate <= 0) return 0;
    return amount / rate;
};

const getToBeBilledAmount = (task: Task): number => {
    if (task.isPartiallyBilled && task.contractUsages && task.contractUsages.length > 0) {
        return task.contractUsages
            .filter(usage => isUsageUnbilled(usage.invoiceId))
            .reduce((sum, usage) => sum + (usage.amountUsed || 0), 0);
    }
    if (!task.isBilled && !task.isPartiallyBilled) {
        return getTaskAmount(task);
    }
    return 0;
};

const getToBeBilledHours = (task: Task): number => {
    if (task.isPartiallyBilled && task.contractUsages && task.contractUsages.length > 0) {
        return amountToHours(getToBeBilledAmount(task), task.rateUsed);
    }
    if (!task.isBilled && !task.isPartiallyBilled) {
        return task.hoursWorked || 0;
    }
    return 0;
};

const getToBePaidAmount = (task: Task): number => {
    if (task.isPartiallyPaid && task.contractUsages && task.contractUsages.length > 0) {
        return task.contractUsages
            .filter(usage => isUsageBilledUnpaid(usage.invoiceId, usage.paymentDate))
            .reduce((sum, usage) => sum + (usage.amountUsed || 0), 0);
    }
    if (!task.isPaid && !task.isPartiallyPaid) {
        return getTaskAmount(task);
    }
    return 0;
};

const getToBePaidHours = (task: Task): number => {
    if (task.isPartiallyPaid && task.contractUsages && task.contractUsages.length > 0) {
        return amountToHours(getToBePaidAmount(task), task.rateUsed);
    }
    if (!task.isPaid && !task.isPartiallyPaid) {
        return task.hoursWorked || 0;
    }
    return 0;
};

const collectLatestDate = (current: string | undefined, candidate?: string): string | undefined => {
    if (!candidate) return current;
    const normalized = candidate.split('T')[0];
    if (!current || normalized > current) {
        return normalized;
    }
    return current;
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
    toBeBilledAmount: number;
    toBeBilledHours: number;
    toBePaidAmount: number;
    toBePaidHours: number;
    latestBillingDate?: string;
    latestPaymentDate?: string;
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
                toBeBilledAmount: 0,
                toBeBilledHours: 0,
                toBePaidAmount: 0,
                toBePaidHours: 0,
                latestBillingDate: undefined,
                latestPaymentDate: undefined,
                currency: task.currency || 'EUR',
                taskCount: 0
            };
        }
        
        acc[key].totalHours += task.hoursWorked || 0;
        acc[key].totalAmount += getTaskAmount(task);
        acc[key].toBeBilledAmount += getToBeBilledAmount(task);
        acc[key].toBeBilledHours += getToBeBilledHours(task);
        acc[key].toBePaidAmount += getToBePaidAmount(task);
        acc[key].toBePaidHours += getToBePaidHours(task);
        acc[key].taskCount += 1;

        acc[key].latestBillingDate = collectLatestDate(acc[key].latestBillingDate, task.billingDate);
        acc[key].latestPaymentDate = collectLatestDate(acc[key].latestPaymentDate, task.paymentDate);
        if (task.contractUsages) {
            for (const usage of task.contractUsages) {
                acc[key].latestBillingDate = collectLatestDate(acc[key].latestBillingDate, usage.billingDate);
                acc[key].latestPaymentDate = collectLatestDate(acc[key].latestPaymentDate, usage.paymentDate);
            }
        }
        
        return acc;
    }, {} as Record<string, ProjectSummaryData>);

    const projectSummaryArray = Object.values(projectSummaries).sort((a, b) => 
        b.totalAmount - a.totalAmount // Sort by total amount descending
    );

    const projectIds = useMemo(
        () => Array.from(new Set(projectSummaryArray.map(summary => summary.projectId).filter(id => id > 0))),
        [projectSummaryArray]
    );

    const [contractAvailabilityByProject, setContractAvailabilityByProject] = useState<Record<number, ContractAvailability>>({});
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    useEffect(() => {
        let cancelled = false;

        const loadContractAvailability = async () => {
            if (projectIds.length === 0) {
                setContractAvailabilityByProject({});
                return;
            }

            const entries = await Promise.all(
                projectIds.map(async (projectId) => {
                    try {
                        const contracts = await contractService.getContractsByProject(projectId);
                        const openContracts = contracts.filter(contract => contract.status === 'OPEN');
                        const source = openContracts.length > 0 ? openContracts : contracts;
                        const amountAvailable = source.reduce((sum, contract) => sum + (contract.amountAvailable || 0), 0);
                        const totalAmount = source.reduce((sum, contract) => sum + (contract.totalAmount || 0), 0);
                        return [projectId, { amountAvailable, totalAmount }] as const;
                    } catch (err) {
                        console.error(`Error loading contracts for project ${projectId}:`, err);
                        return [projectId, { amountAvailable: 0, totalAmount: 0 }] as const;
                    }
                })
            );

            if (!cancelled) {
                setContractAvailabilityByProject(Object.fromEntries(entries));
            }
        };

        loadContractAvailability();
        return () => {
            cancelled = true;
        };
    }, [projectIds.join(',')]);

    // Determine if summary should be shown
    const urlMonth = searchParams.get('month');
    const urlYear = searchParams.get('year');
    const urlProjectId = searchParams.get('projectId');
    const hasActiveFilters = monthFilter || yearFilter || urlMonth || urlYear ||
                           projectFilter !== null || urlProjectId ||
                           debouncedSearchTerm || statusFilter !== 'all' || typeFilter !== null;
    
    const shouldShow = hasActiveFilters && allFilteredTasks.length > 0 && projectSummaryArray.length > 0;

    const toggleCard = (key: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    if (!shouldShow) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Project Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectSummaryArray.map((summary) => {
                    const cardKey = `${summary.projectId}-${summary.projectName}`;
                    const isExpanded = expandedCards.has(cardKey);

                    return (
                        <div
                            key={cardKey}
                            role="button"
                            tabIndex={0}
                            aria-expanded={isExpanded}
                            onClick={() => toggleCard(cardKey)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleCard(cardKey);
                                }
                            }}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <Tooltip content={summary.projectName} className="min-w-0 flex-1 block" multiline>
                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                        {summary.projectName}
                                    </h3>
                                </Tooltip>
                                <span className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                                    {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </span>
                            </div>
                            <div className="space-y-1 text-sm">
                                {isExpanded ? (
                                    <>
                                        <ContractAmountBlock availability={contractAvailabilityByProject[summary.projectId]} />
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
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Latest bill date:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{formatDate(summary.latestBillingDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Latest payment date:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{formatDate(summary.latestPaymentDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">To be billed:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ({formatNumber(summary.toBeBilledHours)}h) {formatCurrencyAmount(summary.toBeBilledAmount, summary.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">To be paid:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ({formatNumber(summary.toBePaidHours)}h) {formatCurrencyAmount(summary.toBePaidAmount, summary.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">Total Amount:</span>
                                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                                {formatCurrencyAmount(summary.totalAmount, summary.currency)}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ContractAmountBlock availability={contractAvailabilityByProject[summary.projectId]} />
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">To be billed:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ({formatNumber(summary.toBeBilledHours)}h) {formatCurrencyAmount(summary.toBeBilledAmount, summary.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">To be paid:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ({formatNumber(summary.toBePaidHours)}h) {formatCurrencyAmount(summary.toBePaidAmount, summary.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">Total Amount:</span>
                                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                                {formatCurrencyAmount(summary.totalAmount, summary.currency)}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectSummary;
