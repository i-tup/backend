import { getAllProjects } from '@robert.tools/gitlab';
import type { Project, Status } from '../../apps/api/api.d';
import { CONFIG_ITEM } from '../../index.d';
import { DEFAULT_DATA } from '../../index.config';

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
        const item: Project = { ...DEFAULT_DATA };
        item.id = project.id.toString();
        item.name = project.name;
        item.description = project.description || '';
        item.url = project.web_url;
        item.institution = 'TU';
        item.source = 'gitlab';
        item.last_updated = project.last_activity_at;
        item.status = 'current' as Status;
        item.goals = [];
        item.lead = project.namespace?.name || 'unknown';
        all.push(item);
    }
    return all;
};
export const getAllGitlabProjects = (config: CONFIG_ITEM): Project[] => {
    const gitlabProjects = getAllProjects(
        config.GITLAB.API,
        config.TOKEN,
        config.GITLAB.MAX_PAGES,
        config.GITLAB.PER_PAGE
    );
    const items = proceedGitlabProjects(gitlabProjects.items);
    return items;
};
