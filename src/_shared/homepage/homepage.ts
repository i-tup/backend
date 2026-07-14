import { absoluteUrl, cleanSpaces } from '@robert.tools/convert';
import { command } from '@robert.tools/cmd';

import { parse } from 'node-html-parser';
import type { Project, Source } from '../../apps/api/api.d';
import { LOG } from '@robert.tools/log';
import { getID } from '../utils/utils';
import { DEFAULT_DATA } from '../../index.config';

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

        const item: Project = { ...DEFAULT_DATA };
        item['id'] = getID(title);
        item['name'] = title;
        item['description'] = description;
        item['image'] = absoluteUrl(imageRaw, source.url);
        item['url'] = source.url;
        item['institution'] = source.institution;
        item['status'] = source.status;
        item['source'] = 'tu.berlin';
        item['goals'] = []; // TODO
        item['last_updated'] = new Date().toISOString(); // TODO

        projects.push(item);
        // projects.push({
        //     id: getID(title),
        //     name: title,
        //     description,
        //     image: absoluteUrl(imageRaw, source.url),
        //     url: source.url,
        //     institution: source.institution,
        //     status: source.status,
        //     source: 'tu.berlin',
        //     goals: [], // TODO
        // });
    }

    return projects;
};

export const crawlSource = (source: Source): Project[] => {
    const html = command(`curl -s "${source.url}"`);

    const projects: Project[] = getProjectsFromHTML(html, source);
    return projects;
};
export const getAllProjectsFromSources = (sources: Source[]): Project[] => {
    const all = [];
    for (const source of sources) {
        LOG.INFO(`crawl: ${source.url}`);
        all.push(...crawlSource(source));
    }
    return all;
};
