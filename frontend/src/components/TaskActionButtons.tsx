import React from 'react';
import { FaCheck } from "@react-icons/all-files/fa/FaCheck";
import { FaFilePdf } from "@react-icons/all-files/fa/FaFilePdf";

interface TaskActionButtonsProps {
    onBillingStatusClick: () => void;
    onPaymentStatusClick: () => void;
    onInfoForBillClick: () => void;
    onGenerateSalClick: () => void;
}

const TaskActionButtons: React.FC<TaskActionButtonsProps> = ({
    onBillingStatusClick,
    onPaymentStatusClick,
    onInfoForBillClick,
    onGenerateSalClick
}) => {
    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={onBillingStatusClick}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center text-sm"
            >
                <FaCheck className="mr-2" />
                Update Billing Status
            </button>
            <button
                onClick={onPaymentStatusClick}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center text-sm"
            >
                <FaCheck className="mr-2" />
                Update Payment Status
            </button>
            <button
                onClick={onInfoForBillClick}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors text-sm"
            >
                Info For Bill
            </button>
            <button
                onClick={onGenerateSalClick}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors flex items-center text-sm"
            >
                <FaFilePdf className="mr-2" />
                Generate SAL
            </button>
        </div>
    );
};

export default TaskActionButtons;
