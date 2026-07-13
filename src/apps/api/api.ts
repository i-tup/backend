import { absoluteUrl, cleanSpaces } from '../../_shared/utils/utils';
import type { Project, Source, Status } from './api.d';
import { parse } from 'node-html-parser';

export const getProjectsFromHTML = (html: string, source: Source) => {
    const root = parse(html);

    const projects: Project[] = [];

    // TU-Seiten sind oft in Content-Blöcken / Frames strukturiert
    const blocks = root.querySelectorAll(
        'article, section, .frame, .ce-textpic, .ce-bodytext'
    );

    for (const block of blocks) {
        const title = cleanSpaces(
            block.querySelector('h2, h3, h4')?.textContent ?? ''
        );

        if (!title || title.length < 3) continue;

        const paragraphs = block
            .querySelectorAll('p')
            .map((p) => cleanSpaces(p.textContent))
            .filter(Boolean);

        const description = paragraphs.join(' ').slice(0, 700);

        if (!description) continue;

        const imageRaw =
            block.querySelector('img')?.getAttribute('src') ??
            block.querySelector('img')?.getAttribute('data-src');

        projects.push({
            name: title,
            description,
            image: absoluteUrl(imageRaw, source.url),
            url: source.url,
            institution: source.institution,
            status: source.status,
            source: 'tu.berlin',
            goals: [], // TODO
        });
    }

    return projects;
};

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
