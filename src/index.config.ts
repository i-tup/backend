import type { Source } from './apps/api/api.d';

export const IS_DEV = false;

export const PER_PAGE = IS_DEV ? 10 : 100;
export const MAX_PAGES = IS_DEV ? 2 : 5;
export const GIT_API = 'https://git.tu-berlin.de/api/v4';

export const SHEET_ID = '1jRF4TR0QfHxxcxPPa7fMJdIB4NQdcmiMO2Uim4Afm1A';
export const SHEET_TAB = 'PROJECTS';

export const sources: Source[] = [
    {
        url: 'https://www.tu.berlin/geoinformation/forschung/projekte/laufende-projekte/',
        institution: 'Geoinformation in der Umweltplanung',
        status: 'current',
    },
    {
        url: 'https://www.tu.berlin/geoinformation/forschung/projekte/abgeschlossene-projekte',
        institution: 'Geoinformation in der Umweltplanung',
        status: 'completed',
    },
    {
        url: 'https://www.tu.berlin/landschaft/forschung/projekte/laufende-projekte',
        institution: 'Institut für Landschaftsarchitektur und Umweltplanung',
        status: 'current',
    },
    {
        url: 'https://www.tu.berlin/ztg/forschung/projekte/laufende-projekte',
        institution: 'Zentrum Technik und Gesellschaft',
        status: 'current',
    },
    {
        url: 'https://www.tu.berlin/ztg/forschung/projekte/abgeschlossene-projekte',
        institution: 'Zentrum Technik und Gesellschaft',
        status: 'completed',
    },
    {
        url: 'https://www.tu.berlin/eim/forschung-projekte/projekte',
        institution: 'Entrepreneurship und Innovationsmanagement',
        status: 'current',
    },
];
