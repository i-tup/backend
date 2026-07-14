export type KEY_VALUE = {
    key: string;
    value: string;
};
export type KEY_VALUES = {
    [key: string]: string;
};

// string or undefined value
export type $string = string | null | undefined;

export type CONFIG_ITEM = {
    TOKEN: string;
    FILE: string;
    SHEET: {
        ID: string;
        TAB: string;
    };
    GITLAB: {
        API: string;
        MAX_PAGES: number;
        PER_PAGE: number;
    };
    SOURCES: Source[];
};
