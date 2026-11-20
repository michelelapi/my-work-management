import React from 'react';
import { FaCheck } from "@react-icons/all-files/fa/FaCheck";
import { FaFilePdf } from "@react-icons/all-files/fa/FaFilePdf";
import { FaBell } from "@react-icons/all-files/fa/FaBell";
import Tooltip from './Tooltip';

interface TaskActionButtonsProps {
    onBillingStatusClick: () => void;
    onPaymentStatusClick: () => void;
    onInfoForBillClick: () => void;
    onBillsInfoClick: () => void;
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
    onBillsInfoClick,
    onGenerateSalClick,
    hasBillingStatusReminder = false,
    hasPaymentStatusReminder = false,
    hasInfoForBillReminder = false,
    hasGenerateSalReminder = false
}) => {
    const ReminderBell = () => (
        <Tooltip content="Active reminder" className="absolute -top-1 -right-1 z-10 inline-flex">
            <span className="bg-red-500 rounded-full p-1 shadow-sm flex">
                <FaBell className="text-white text-[10px]" />
            </span>
        </Tooltip>
    );

    return (
        <div className="flex flex-wrap gap-2">
            <Tooltip content="Set billed/unbilled with invoice ID and billing date">
                <button
                    onClick={onBillingStatusClick}
                    className="relative bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-md transition-colors flex items-center text-sm"
                >
                    {hasBillingStatusReminder && <ReminderBell />}
                    <FaCheck className="mr-2" />
                    Update Billing Status
                </button>
            </Tooltip>
            <Tooltip content="Set paid/unpaid with payment date">
                <button
                    onClick={onPaymentStatusClick}
                    className="relative bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-md transition-colors flex items-center text-sm"
                >
                    {hasPaymentStatusReminder && <ReminderBell />}
                    <FaCheck className="mr-2" />
                    Update Payment Status
                </button>
            </Tooltip>
            <Tooltip content="Hours, task IDs and total for selected tasks">
                <button
                    onClick={onInfoForBillClick}
                    className="relative bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md transition-colors text-sm"
                >
                    {hasInfoForBillReminder && <ReminderBell />}
                    Info To Bill
                </button>
            </Tooltip>
            <Tooltip content="Invoices, billing and payment dates for the project">
                <button
                    onClick={onBillsInfoClick}
                    className="relative bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-md transition-colors text-sm"
                >
                    Bills Info
                </button>
            </Tooltip>
            <Tooltip content="Generate SAL PDF for the filtered period">
                <button
                    onClick={onGenerateSalClick}
                    className="relative bg-purple-500 hover:bg-purple-600 text-black px-4 py-2 rounded-md transition-colors flex items-center text-sm"
                >
                    {hasGenerateSalReminder && <ReminderBell />}
                    <FaFilePdf className="mr-2" />
                    Generate SAL
                </button>
            </Tooltip>
        </div>
    );
};

export default TaskActionButtons;
