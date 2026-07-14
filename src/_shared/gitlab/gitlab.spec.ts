import { proceedGitlabProjects } from './gitlab';

describe('proceedGitlabProjects', () => {
    const FN = proceedGitlabProjects;
    const user = 'xxx';
    const ITEM = {
        id: 49213,
        description: 'A sample project',
        name: 'PromediPython',
        name_with_namespace: `Hans Robert Schmidt / PromediPython`,
        path: 'promediPython',
        path_with_namespace: `${user}/promediPython`,
        created_at: '2025-06-08T14:17:40.340Z',
        default_branch: 'main',
        tag_list: [],
        topics: [],
        ssh_url_to_repo: `git@git.tu-berlin.de:${user}/promediPython.git`,
        http_url_to_repo: `https://git.tu-berlin.de/${user}/promediPython.git`,
        web_url: `https://git.tu-berlin.de/${user}/promediPython`,
        readme_url: null,
        forks_count: 0,
        avatar_url: null,
        star_count: 0,
        last_activity_at: '2025-07-17T22:10:23.873Z',
        visibility: 'public',
        namespace: {
            id: 59754,
            name: 'Hans Robert Schmidt',
            path: user,
            kind: 'user',
            full_path: user,
            parent_id: null,
            avatar_url: 'https://secure.gravatar.com/avatar/ae89',
            web_url: `https://git.tu-berlin.de/${user}`,
        },
    };
    it('should transform GitLab project data to our format', () => {
        const EXPECTED = [
            {
                description: 'A sample project',
                goals: [],
                id: '49213',
                institution: 'TU',
                last_updated: '2025-07-17T22:10:23.873Z',
                name: 'PromediPython',
                source: 'gitlab',
                status: 'current',
                url: `https://git.tu-berlin.de/${user}/promediPython`,
                building: 'unknown',
                co2e: 0,
                lead: 'Hans Robert Schmidt',
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
                // image: '',
            },
        ];
        expect(FN([ITEM])).toEqual(EXPECTED);
    });
});
