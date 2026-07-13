import type { Project, Status } from './api.d';
export const proceedGitlabProjects = (items: any[]): Project[] => {
    const all = [];
    // console.log(items[0])
    for (const project of items) {
        // if(project.description !== null){
        //     console.log(project)
        // }
        if (project.visibility !== 'public') {
            // console.log(project);
            // continue;
        }
        const item = {
            id: project.id,
            name: project.name,
            description: project.description || '',
            url: project.web_url,
            institution: 'TU',
            source: 'gitlab',
            last_updated: project.last_activity_at,
            status: 'current' as Status,
            goals: [],
        };
        all.push(item);
    }
    return all;
};
