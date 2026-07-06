import React, { useEffect, useRef, useState } from 'react';
import { Task } from '../types/task';
import { FaGripVertical } from '@react-icons/all-files/fa/FaGripVertical';

export type SortableTaskListAccent = 'purple' | 'green';

interface SortableTaskListProps {
    tasks: Task[];
    isActive: boolean;
    accent?: SortableTaskListAccent;
    onOrderedTasksChange: (tasks: Task[]) => void;
}

const formatTaskDate = (startDate: string): string => {
    const dateStr = startDate.split('T')[0];
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return startDate;
    return `${d}/${m}/${y}`;
};

const formatAmount = (task: Task): string => {
    const hours = task.hoursWorked ?? 0;
    const rate = task.rateUsed ?? 0;
    return (hours * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const accentClasses: Record<SortableTaskListAccent, { dragOver: string; hover: string }> = {
    purple: {
        dragOver: 'bg-purple-50 dark:bg-purple-900/30 border-t-2 border-t-purple-400',
        hover: 'hover:bg-gray-50 dark:hover:bg-gray-700'
    },
    green: {
        dragOver: 'bg-green-50 dark:bg-green-900/30 border-t-2 border-t-green-400',
        hover: 'hover:bg-gray-50 dark:hover:bg-gray-700'
    }
};

const SortableTaskList: React.FC<SortableTaskListProps> = ({
    tasks,
    isActive,
    accent = 'purple',
    onOrderedTasksChange
}) => {
    const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragIndexRef = useRef<number | null>(null);
    const styles = accentClasses[accent];

    useEffect(() => {
        if (isActive) {
            const next = [...tasks];
            setOrderedTasks(next);
            onOrderedTasksChange(next);
            dragIndexRef.current = null;
            setDragOverIndex(null);
        }
    }, [isActive, tasks, onOrderedTasksChange]);

    const updateOrder = (next: Task[]) => {
        setOrderedTasks(next);
        onOrderedTasksChange(next);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragIndexRef.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragIndexRef.current !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);
        const fromIndex = dragIndexRef.current;
        if (fromIndex === null || fromIndex === dropIndex) {
            return;
        }
        const next = [...orderedTasks];
        const [dragged] = next.splice(fromIndex, 1);
        next.splice(dropIndex, 0, dragged);
        dragIndexRef.current = null;
        updateOrder(next);
    };

    const handleDragEnd = () => {
        dragIndexRef.current = null;
        setDragOverIndex(null);
    };

    return (
        <div
            className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md min-h-0"
            onDragLeave={handleDragLeave}
        >
            {orderedTasks.map((task, index) => (
                <div
                    key={task.id ?? index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 select-none cursor-grab active:cursor-grabbing ${
                        dragOverIndex === index ? styles.dragOver : styles.hover
                    }`}
                >
                    <span className="text-gray-400 flex-shrink-0 touch-none" aria-hidden="true">
                        <FaGripVertical />
                    </span>
                    <span className="text-xs text-gray-400 w-6 flex-shrink-0">{index + 1}.</span>
                    <div className="flex-1 min-w-0 pointer-events-none">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {task.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {task.ticketId && <span className="mr-2">{task.ticketId}</span>}
                            {task.startDate && <span>{formatTaskDate(task.startDate)}</span>}
                        </div>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex-shrink-0 pointer-events-none">
                        {formatAmount(task)}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SortableTaskList;
