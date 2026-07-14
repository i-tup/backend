import type { CONFIG_ITEM } from '../../index.d';
import type { Project, Source, Status } from './api.d';
import { parse } from 'node-html-parser';
import { getAllProjects } from '../../_shared/gitlab/gitlab';
import { LOG } from '@robert.tools/log';
import { FS } from '@robert.tools/fs';
import { absoluteUrl, cleanSpaces } from '@robert.tools/convert';
import { command } from '@robert.tools/cmd';
import { getSheetData } from '@robert.tools/google';

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

export const proceedSheetData = (sheetJson: any) => {
    const all: Project[] = [];
    for (const item of sheetJson.table.rows) {
        const data = item.c;
        const dataSet: Partial<Project> = {};
        let i = 0;
        for (const row of sheetJson.table.cols) {
            // dataSet[row.label] = row.context;

            const key = row.label.toLowerCase() as keyof Project;
            if (key.indexOf('zeitstempel') > -1) {
                dataSet['lastUpdated'] = data[i].v;
            } else if (key.indexOf('goal') > -1) {
                dataSet['goals'] = data[i].v
                    .split(',')
                    .map((g: string) => g.trim());
            } else {
                dataSet[key] = data[i].v;
            }
            dataSet['source'] = 'google form';
            i++;
        }
        all.push(dataSet as Project);
    }
    return all;
};

const crawlSource = (source: Source): Project[] => {
    const html = command(`curl -s "${source.url}"`);

    const projects: Project[] = getProjectsFromHTML(html, source);
    return projects;
};

export const getProjects = (config: CONFIG_ITEM) => {
    try {
        const all: Project[] = [];
        const gitlabProjects = getAllProjects(
            config.GITLAB.API,
            config.TOKEN,
            config.GITLAB.MAX_PAGES,
            config.GITLAB.PER_PAGE
        );
        // console.log(gitlabProjects.items.length);
        const items = proceedGitlabProjects(gitlabProjects.items);
        all.push(...items);
        const sheetJson = getSheetData(config.SHEET.ID, config.SHEET.TAB);
        const sheetProjects = proceedSheetData(sheetJson);
        LOG.OK(`sheetProjects: ${sheetProjects.length}`);
        all.push(...sheetProjects);
        for (const source of config.SOURCES) {
            LOG.INFO(`crawl: ${source.url}`);
            all.push(...crawlSource(source));
        }
        const finalData = {
            data: all,
            lastUpdated: new Date().toISOString(),
            $schema: './projects.schema.json',
        };
        // copy projects.schmea
        //   await fs.copyFile('projects.schema.json', 'output/projects.schema.json');
        FS.writeFile(config.FILE, JSON.stringify(finalData, null, 2));
        LOG.OK(`done: ${all.length} projects written to ${config.FILE}`);
    } catch (error: any) {
        LOG.FAIL(error);
        process.exit(1);
    }
};
