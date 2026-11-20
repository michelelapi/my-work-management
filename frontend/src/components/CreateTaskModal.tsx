import React, { useState } from 'react';
import { Task } from '../types/task';
import {
    parseTaskImportJson,
    ParsedTaskImport,
    TASK_IMPORT_JSON_EXAMPLE
} from '../utils/taskImport';

type CreateMode = 'choice' | 'json' | 'confirm';

interface CreateTaskModalProps {
    isOpen: boolean;
    projectName?: string;
    creating?: boolean;
    onClose: () => void;
    onManual: () => void;
    onConfirmCreate: (task: Partial<Task>, clientName?: string) => Promise<void>;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    isOpen,
    projectName,
    creating = false,
    onClose,
    onManual,
    onConfirmCreate
}) => {
    const [mode, setMode] = useState<CreateMode>('choice');
    const [jsonText, setJsonText] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [pendingImports, setPendingImports] = useState<ParsedTaskImport[]>([]);

    if (!isOpen) {
        return null;
    }

    const resetState = () => {
        setMode('choice');
        setJsonText('');
        setParseError(null);
        setCreateError(null);
        setSuccessMessage(null);
        setPendingImports([]);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleParseJson = () => {
        try {
            setParseError(null);
            setSuccessMessage(null);
            const imports = parseTaskImportJson(jsonText);
            setPendingImports(imports);
            setMode('confirm');
        } catch (err) {
            setParseError(err instanceof Error ? err.message : 'Failed to parse JSON');
        }
    };

    const handleConfirmCreate = async () => {
        if (pendingImports.length === 0) {
            return;
        }
        setCreateError(null);
        let created = 0;
        try {
            for (const item of pendingImports) {
                await onConfirmCreate(item.task, item.clientName);
                created += 1;
            }
            const message = created === 1
                ? `Task "${pendingImports[0].task.title}" created successfully.`
                : `${created} tasks created successfully.`;
            setSuccessMessage(message);
            setJsonText('');
            setPendingImports([]);
            setMode('json');
        } catch (err) {
            const base = err instanceof Error ? err.message : 'Failed to create task';
            const remaining = pendingImports.length - created;
            if (created > 0 && remaining > 0) {
                setCreateError(
                    `${base} Created ${created} of ${pendingImports.length}; ${remaining} not created.`
                );
                setPendingImports(pendingImports.slice(created));
            } else {
                setCreateError(base);
            }
        }
    };

    const handleLoadExample = () => {
        setJsonText(JSON.stringify(TASK_IMPORT_JSON_EXAMPLE, null, 2));
        setParseError(null);
        setSuccessMessage(null);
    };

    const taskCount = pendingImports.length;
    const isBatch = taskCount > 1;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className={`relative p-5 border shadow-lg rounded-md bg-white dark:bg-gray-800 ${mode === 'choice' ? 'w-full max-w-md' : 'w-full max-w-2xl'}`}>
                {mode === 'choice' && (
                    <div className="mt-2 text-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                            Create New Task
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            How do you want to enter the task data?
                        </p>
                        <div className="flex flex-col space-y-3 mt-6">
                            <button
                                type="button"
                                onClick={onManual}
                                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                Insert manually
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('json')}
                                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                Paste JSON
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'json' && (
                    <div className="mt-2">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white text-center">
                            Paste Task JSON
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Paste a JSON object or an array of objects. After confirmation tasks are created so you can paste more.
                        </p>
                        {successMessage && (
                            <p className="mt-3 text-sm text-green-600 dark:text-green-400 text-center">{successMessage}</p>
                        )}
                        <textarea
                            value={jsonText}
                            onChange={(e) => {
                                setJsonText(e.target.value);
                                setParseError(null);
                                setSuccessMessage(null);
                            }}
                            rows={16}
                            spellCheck={false}
                            placeholder={JSON.stringify(TASK_IMPORT_JSON_EXAMPLE, null, 2)}
                            className="mt-4 w-full font-mono text-xs rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3"
                        />
                        {parseError && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{parseError}</p>
                        )}
                        <div className="flex flex-wrap justify-between gap-2 mt-4">
                            <button
                                type="button"
                                onClick={handleLoadExample}
                                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                Load example
                            </button>
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode('choice');
                                        setParseError(null);
                                        setSuccessMessage(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Done
                                </button>
                                <button
                                    type="button"
                                    onClick={handleParseJson}
                                    disabled={!jsonText.trim()}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'confirm' && taskCount > 0 && (
                    <div className="mt-2">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white text-center">
                            {isBatch ? `Create these ${taskCount} tasks?` : 'Create this task?'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Review the data below, then confirm to create
                            {isBatch ? ' the tasks' : ' the task'} without opening the form.
                        </p>
                        <div className="mt-4 border border-gray-200 dark:border-gray-600 rounded-md divide-y divide-gray-200 dark:divide-gray-600 max-h-96 overflow-y-auto">
                            {pendingImports.map((item, index) => {
                                const { task, clientName } = item;
                                const summaryRows: { label: string; value: string }[] = [
                                    { label: 'Title', value: task.title || '-' },
                                    { label: 'Ticket ID', value: task.ticketId || '-' },
                                    { label: 'Referenced Task', value: task.referencedTaskId || '-' },
                                    { label: 'Client', value: clientName || task.clientName || '-' },
                                    { label: 'Start Date', value: task.startDate || '-' },
                                    { label: 'End Date', value: task.endDate || '-' },
                                    { label: 'Hours', value: task.hoursWorked != null ? String(task.hoursWorked) : '-' },
                                    { label: 'Type', value: task.type || '-' },
                                    { label: 'Project', value: projectName || 'Current project filter' }
                                ];
                                return (
                                    <div key={`${task.ticketId || task.title}-${index}`} className="px-3 py-3">
                                        {isBatch && (
                                            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                                                Task {index + 1} of {taskCount}
                                            </div>
                                        )}
                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {summaryRows.map(row => (
                                                <div key={row.label} className="flex justify-between gap-4 py-1.5 text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400 shrink-0">{row.label}</span>
                                                    <span className="text-gray-900 dark:text-white text-right break-all">{row.value}</span>
                                                </div>
                                            ))}
                                            {task.description && (
                                                <div className="py-1.5 text-sm">
                                                    <div className="text-gray-500 dark:text-gray-400 mb-1">Description</div>
                                                    <div className="text-gray-900 dark:text-white whitespace-pre-wrap">{task.description}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {createError && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{createError}</p>
                        )}
                        <div className="flex justify-end space-x-2 mt-4">
                            <button
                                type="button"
                                disabled={creating}
                                onClick={() => {
                                    setMode('json');
                                    setCreateError(null);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md shadow-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                disabled={creating}
                                onClick={handleConfirmCreate}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {creating
                                    ? 'Creating...'
                                    : isBatch
                                        ? `Create ${taskCount} tasks`
                                        : 'Create task'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateTaskModal;
