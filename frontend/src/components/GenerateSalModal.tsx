import React, { useCallback, useState } from 'react';
import { Task } from '../types/task';
import { FaFilePdf } from '@react-icons/all-files/fa/FaFilePdf';
import SortableTaskList from './SortableTaskList';

interface GenerateSalModalProps {
    isOpen: boolean;
    tasks: Task[];
    year: number;
    month: number;
    generating?: boolean;
    onClose: () => void;
    onGenerate: (orderedTaskIds: number[]) => void;
}

const GenerateSalModal: React.FC<GenerateSalModalProps> = ({
    isOpen,
    tasks,
    year,
    month,
    generating = false,
    onClose,
    onGenerate
}) => {
    const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);

    const handleOrderedTasksChange = useCallback((next: Task[]) => {
        setOrderedTasks(next);
    }, []);

    if (!isOpen) return null;

    const handleGenerate = () => {
        const ids = orderedTasks
            .map(t => t.id)
            .filter((id): id is number => id !== undefined);
        if (ids.length === 0) return;
        onGenerate(ids);
    };

    const monthLabel = String(month).padStart(2, '0');

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900">
                        <FaFilePdf className="h-6 w-6 text-purple-600 dark:text-purple-200" />
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center">
                    Generate SAL
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} for {monthLabel}/{year}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 mb-4 px-2">
                    Drag tasks to set the order used in the SAL and when splitting across contracts.
                </p>

                <div className="mb-4 min-h-0 flex-1 flex flex-col">
                    <SortableTaskList
                        tasks={tasks}
                        isActive={isOpen}
                        accent="purple"
                        onOrderedTasksChange={handleOrderedTasksChange}
                    />
                </div>

                <div className="flex justify-center gap-4 pt-2">
                    <button
                        onClick={onClose}
                        disabled={generating}
                        className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || orderedTasks.length === 0}
                        className="px-4 py-2 bg-purple-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 flex items-center gap-2"
                    >
                        {generating ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FaFilePdf />
                                Generate SAL
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateSalModal;
