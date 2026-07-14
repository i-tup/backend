import { getProjectsFromDemoData } from './demo';

describe('getProjectsFromDemoData', () => {
    const FN = getProjectsFromDemoData;
    it('should return demo data', () => {
        const input = [
            {
                id: 'chp',
                name: 'Campus CHP Modernisation',
                dim: 'Energy',
                fac: 'Fak. III · Prozesswissenschaften',
                bldg: 'Heizkraftwerk (EW)',
                lead: 'Prof. M. Hollstein',
                status: 'ongoing',
                co2e: 1850,
                base: 5200,
                cost: 4600000,
                eur: 71,
                s: {
                    carbon: 90,
                    cost: 80,
                    sdg: 55,
                    lockin: 62,
                    data: 85,
                },
                sdgs: [7, 13, 9],
                syn: [
                    [
                        'pv',
                        'Shared campus grid; combined dispatch trims peak import',
                    ],
                    [
                        'cool',
                        'Waste heat feeds the server-room free-cooling loop',
                    ],
                ],
                blurb: 'My Description',
            },
        ];
        const EXPECTED = [
            {
                kpi: {
                    carbon: 90,
                    cost: 80,
                    sdg: 55,
                    lockin: 62,
                    data: 85,
                },
                id: 'campus_chp_modernisation',
                name: 'Campus CHP Modernisation',
                dimension: 'Energy',
                institution: 'Fak. III · Prozesswissenschaften',
                building: 'Heizkraftwerk (EW)',
                lead: 'Prof. M. Hollstein',
                status: 'ongoing',
                source: 'demo',
                co2e: 1850,
                base: 5200,
                cost: 4600000,
                eur: 71,
                description: 'My Description',
                goals: [7, 13, 9],
                synenergies: [
                    [
                        'pv',
                        'Shared campus grid; combined dispatch trims peak import',
                    ],
                    [
                        'cool',
                        'Waste heat feeds the server-room free-cooling loop',
                    ],
                ],
            },
        ];
        expect(FN(input)).toEqual(EXPECTED);
    });
});
