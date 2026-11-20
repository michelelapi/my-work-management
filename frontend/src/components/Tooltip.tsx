import React, { ReactNode } from 'react';

type TooltipPosition = 'top' | 'bottom';

interface TooltipProps {
    content: string;
    children: ReactNode;
    position?: TooltipPosition;
    className?: string;
    multiline?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    className = '',
    multiline = false
}) => {
    const positionClasses =
        position === 'bottom'
            ? 'top-full mt-2'
            : 'bottom-full mb-2';

    const arrowClasses =
        position === 'bottom'
            ? 'bottom-full border-b-gray-900 dark:border-b-gray-700 border-b-4 border-x-4 border-x-transparent'
            : 'top-full border-t-gray-900 dark:border-t-gray-700 border-t-4 border-x-4 border-x-transparent';

    const textClasses = multiline
        ? 'whitespace-normal max-w-xs'
        : 'whitespace-nowrap max-w-xs';

    return (
        <span className={`relative group/tooltip ${className || 'inline-flex'}`}>
            {children}
            <span
                role="tooltip"
                className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 ${positionClasses}
                    w-max ${textClasses} px-2.5 py-1.5 rounded-md
                    bg-gray-900 text-white text-xs leading-snug text-center shadow-lg
                    dark:bg-gray-700
                    opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100
                    transition duration-150 ease-out`}
            >
                {content}
                <span
                    aria-hidden="true"
                    className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${arrowClasses}`}
                />
            </span>
        </span>
    );
};

export default Tooltip;
