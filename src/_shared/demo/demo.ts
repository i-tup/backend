import type { Project, Status } from '../../apps/api/api.d';
import { getID } from '../utils/utils';

export const getProjectsFromDemoData = (data: any[]): Project[] => {
    const projects: Project[] = [];
    for (const item of data) {
        const project: Project = {
            id: getID(item.name),
            name: item.name,
            description: item.blurb,
            building: item.bldg,
            co2e: 1850,
            lead: item.lead,
            base: 5200,
            cost: 4600000,
            eur: 71,
            kpi: item.s,
            synenergies: item.syn,
            institution: item.fac,
            dimension: item.dim,
            status: item.status as Status,
            source: 'demo',
            goals: item.sdgs || [],
        };
        projects.push(project);
    }
    return projects;
};
