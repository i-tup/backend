export const normalizeText = (value: string) => {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
};

export const cleanSpaces = (text: string): string => {
    return text.replace(/\s+/g, ' ').trim();
};

export const absoluteUrl = (
    value: string | undefined,
    baseUrl: string
): string | undefined => {
    if (!value) return undefined;

    try {
        return new URL(value, baseUrl).href;
    } catch {
        return undefined;
    }
};
