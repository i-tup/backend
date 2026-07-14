import { proceedSheetData } from './google';

describe('proceedSheetData', () => {
    const FN = proceedSheetData;
    const SHEET_JSON = {
        table: {
            cols: [
                { label: 'Name' },
                { label: 'Description' },
                { label: 'Goal' },
                { label: 'Zeitstempel' },
            ],
            rows: [
                {
                    c: [
                        { v: 'Project Name' },
                        { v: 'Project Description' },
                        { v: '1 Project Goal, 3 industry, health' },
                        { v: '2025-07-17T22:10:23.873Z' },
                    ],
                },
            ],
        },
    };
    it('should transform Google Sheet data to our format', () => {
        const EXPECTED = [
            {
                name: 'Project Name',
                description: 'Project Description',
                goals: [1, 3],
                last_updated: '2025-07-17T22:10:23.873Z',
                source: 'google form',
                id: 'project_name',
                building: 'unknown',
                co2e: 0,
                lead: 'unknown',
                base: 0,
                cost: 0,
                eur: 0,
                kpi: {
                    carbon: 0,
                    cost: 0,
                    sdg: 0,
                    lockin: 0,
                    data: 0,
                },
                synenergies: [],
                dimension: 'Digital',
                institution: 'unknown',
                status: 'unknown',
            },
        ];
        expect(FN(SHEET_JSON)).toEqual(EXPECTED);
    });
});
