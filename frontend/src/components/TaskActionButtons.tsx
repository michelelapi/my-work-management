import React from 'react';
import { FaCheck } from "@react-icons/all-files/fa/FaCheck";
import { FaFilePdf } from "@react-icons/all-files/fa/FaFilePdf";
import { FaBell } from "@react-icons/all-files/fa/FaBell";

interface TaskActionButtonsProps {
    onBillingStatusClick: () => void;
    onPaymentStatusClick: () => void;
    onInfoForBillClick: () => void;
    onGenerateSalClick: () => void;
    hasBillingStatusReminder?: boolean;
    hasPaymentStatusReminder?: boolean;
    hasInfoForBillReminder?: boolean;
    hasGenerateSalReminder?: boolean;
}

const TaskActionButtons: React.FC<TaskActionButtonsProps> = ({
    onBillingStatusClick,
    onPaymentStatusClick,
    onInfoForBillClick,
    onGenerateSalClick,
    hasBillingStatusReminder = false,
    hasPaymentStatusReminder = false,
    hasInfoForBillReminder = false,
    hasGenerateSalReminder = false
}) => {
    const ReminderBell = () => (
        <span
            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-sm"
            title="Active reminder"
        >
            <FaBell className="text-white text-[10px]" />
        </span>
    );

    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={onBillingStatusClick}
                className="relative bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center text-sm"
            >
                {hasBillingStatusReminder && <ReminderBell />}
                <FaCheck className="mr-2" />
                Update Billing Status
            </button>
            <button
                onClick={onPaymentStatusClick}
                className="relative bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center text-sm"
            >
                {hasPaymentStatusReminder && <ReminderBell />}
                <FaCheck className="mr-2" />
                Update Payment Status
            </button>
            <button
                onClick={onInfoForBillClick}
                className="relative bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
                {hasInfoForBillReminder && <ReminderBell />}
                Info For Bill
            </button>
            <button
                onClick={onGenerateSalClick}
                className="relative bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors flex items-center text-sm"
            >
                {hasGenerateSalReminder && <ReminderBell />}
                <FaFilePdf className="mr-2" />
                Generate SAL
            </button>
        </div>
    );
};

export default TaskActionButtons;
