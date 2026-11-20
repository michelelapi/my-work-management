import { Task } from '../types/task';

/**
 * JSON shape used when pasting Redmine (or other) task data into "Create New Task".
 * Dates accepted as YYYY-MM-DD or DD/MM/YYYY.
 * Paste a single object or an array of objects.
 */
export interface TaskImportJson {
    ticketId?: string;
    title: string;
    description?: string;
    referencedTaskId?: string;
    clientName?: string;
    startDate: string;
    endDate?: string;
    hoursWorked: number;
    type?: string;
    notes?: string;
    currency?: string;
    rateUsed?: number;
    isBilled?: boolean;
    isPaid?: boolean;
}

export interface ParsedTaskImport {
    task: Partial<Task>;
    clientName?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EU_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function normalizeImportDate(value: string | undefined): string | undefined {
    if (!value || !value.trim()) {
        return undefined;
    }
    const trimmed = value.trim();
    if (ISO_DATE.test(trimmed)) {
        return trimmed;
    }
    const match = trimmed.match(EU_DATE);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }
    return trimmed;
}

function parseSingleTaskObject(data: Record<string, unknown>, indexLabel?: string): ParsedTaskImport {
    const prefix = indexLabel ? `${indexLabel}: ` : '';

    const title = typeof data.title === 'string' ? data.title.trim() : '';
    if (!title) {
        throw new Error(`${prefix}Field "title" is required.`);
    }

    const startDateRaw = typeof data.startDate === 'string' ? data.startDate : '';
    const startDate = normalizeImportDate(startDateRaw);
    if (!startDate) {
        throw new Error(`${prefix}Field "startDate" is required (YYYY-MM-DD or DD/MM/YYYY).`);
    }

    const hoursWorked = typeof data.hoursWorked === 'number'
        ? data.hoursWorked
        : typeof data.hoursWorked === 'string'
            ? parseFloat(data.hoursWorked)
            : NaN;
    if (isNaN(hoursWorked) || hoursWorked <= 0) {
        throw new Error(`${prefix}Field "hoursWorked" must be a number greater than 0.`);
    }

    let type: string | undefined;
    if (typeof data.type === 'string' && data.type.trim()) {
        const normalizedType = data.type.trim().toUpperCase();
        if (normalizedType !== 'EVOLUTIVA' && normalizedType !== 'CORRETTIVA') {
            throw new Error(`${prefix}Field "type" must be "EVOLUTIVA" or "CORRETTIVA".`);
        }
        type = normalizedType;
    }

    const clientName = typeof data.clientName === 'string' && data.clientName.trim()
        ? data.clientName.trim()
        : undefined;

    const task: Partial<Task> = {
        title,
        startDate,
        hoursWorked,
        description: typeof data.description === 'string' ? data.description : undefined,
        ticketId: typeof data.ticketId === 'string' || typeof data.ticketId === 'number'
            ? String(data.ticketId)
            : undefined,
        referencedTaskId: typeof data.referencedTaskId === 'string' || typeof data.referencedTaskId === 'number'
            ? String(data.referencedTaskId)
            : undefined,
        endDate: normalizeImportDate(typeof data.endDate === 'string' ? data.endDate : undefined),
        type: type || 'CORRETTIVA',
        notes: typeof data.notes === 'string' ? data.notes : undefined,
        currency: typeof data.currency === 'string' && data.currency.trim()
            ? data.currency.trim().toUpperCase()
            : 'EUR',
        rateUsed: typeof data.rateUsed === 'number' ? data.rateUsed : undefined,
        isBilled: typeof data.isBilled === 'boolean' ? data.isBilled : false,
        isPaid: typeof data.isPaid === 'boolean' ? data.isPaid : false,
        clientName
    };

    return { task, clientName };
}

/**
 * Accepts a single task object or an array of task objects.
 * Returns one or more parsed tasks ready for creation.
 */
export function parseTaskImportJson(raw: string): ParsedTaskImport[] {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error('Invalid JSON. Please check the format and try again.');
    }

    if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
            throw new Error('JSON array must contain at least one task.');
        }
        return parsed.map((item, index) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                throw new Error(`Task[${index}]: must be an object representing a task.`);
            }
            return parseSingleTaskObject(item as Record<string, unknown>, `Task[${index}]`);
        });
    }

    if (!parsed || typeof parsed !== 'object') {
        throw new Error('JSON must be a task object or an array of task objects.');
    }

    return [parseSingleTaskObject(parsed as Record<string, unknown>)];
}

/** Example payload matching a Redmine issue snapshot (for docs / UI hint). */
export const TASK_IMPORT_JSON_EXAMPLE: TaskImportJson = {
    ticketId: '72196',
    title: 'Sviluppo BE - Home Accesso Unitario - 7 Competenze Ammesse',
    description: 'Capitoli analisi:\nCap. 7 Competenze Ammesse (lotto A)',
    referencedTaskId: '70847',
    clientName: 'AU',
    startDate: '2026-10-12',
    endDate: '2026-10-13',
    hoursWorked: 16,
    type: 'EVOLUTIVA',
    currency: 'EUR'
};
