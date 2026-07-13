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
