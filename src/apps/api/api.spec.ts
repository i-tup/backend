import type { Source } from './api.d';
import { getProjectsFromHTML, proceedGitlabProjects } from './api';

describe('getProjectsFromHTML', () => {
    const FN = getProjectsFromHTML;
    const IMAGE = 'https://www.static.tu.berlin/fileadmin/csm_Fieldwork_Harz_';
    const HTML = `
    <article class="teaser">
        <figure class="teaser__image img-wrap">
            <img loading="lazy" srcset="${IMAGE}229d8a2591.jpeg 640w,
                ${IMAGE}18dd1493a3.jpeg 960w,
                ${IMAGE}20fd8d9479.jpeg 1280w" sizes="(min-width: 992px) calc(50vw - 80px),
                (max-width: 991px) calc(100vw - 40px)" src="${IMAGE}18dd1493a3.jpeg" width="960" height="540" alt="">
            <small class="copyright"><i>©</i>&nbsp;R. Jackisch</small>
        </figure>
        <div class="teaser__content">
            <h3 class="teaser__header">My Title</h3>
            <div class="teaser__text">
                <p>A Description. </p>
            </div>
            <footer class="teaser__buttonWrapper">
                <a href="/my/link" target="_blank" title="My Title" class="teaser__link"><span class="button ">mehr</span></a>
            </footer>
        </div>
    </article>`;
    const SOURCE: Source = {
        url: 'https://www.tu.berlin/geoinformation/forschung/projekte/laufende-projekte/',
        institution: 'Geoinformation in der Umweltplanung',
        status: 'current',
    };

    it('should extract project data from HTML', () => {
        const EXPECTED = [
            {
                name: 'My Title',
                description: 'A Description.',
                image: `${IMAGE}18dd1493a3.jpeg`,
                url: SOURCE.url,
                institution: SOURCE.institution,
                status: SOURCE.status,
                source: 'tu.berlin',
                goals: [],
            },
        ];
        expect(FN(HTML, SOURCE)).toEqual(EXPECTED);
    });
});

describe('proceedGitlabProjects', () => {
    const FN = proceedGitlabProjects;
    const user = 'luisseeling';
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
                id: 49213,
                institution: 'TU',
                last_updated: '2025-07-17T22:10:23.873Z',
                name: 'PromediPython',
                source: 'gitlab',
                status: 'current',
                url: `https://git.tu-berlin.de/${user}/promediPython`,
            },
        ];
        expect(FN([ITEM])).toEqual(EXPECTED);
    });
});
