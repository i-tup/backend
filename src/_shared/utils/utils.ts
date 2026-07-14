import { normalizeText } from '@robert.tools/convert';

export const getID = (value: string): string => {
    return normalizeText(value).replace(/-/g, '_').replace(/\s+/g, '_');
};
