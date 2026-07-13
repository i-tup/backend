import type { Project, Source } from './apps/api/api.d';

// src/index.ts
import { parse } from 'node-html-parser';
import fs from 'node:fs/promises';
import { getSheetData } from './_shared/google/google';
import { getAllProjects } from './_shared/gitlab/gitlab';
import { proceedGitlabProjects } from './apps/api/api';
import { LOG } from './_shared/log/log';
import { cleanSpaces } from './_shared/utils/utils';
import {
    GIT_API,
    MAX_PAGES,
    PER_PAGE,
    sources,
    SHEET_ID,
    SHEET_TAB,
} from './index.config';

function absoluteUrl(
    value: string | undefined,
    baseUrl: string
): string | undefined {
    if (!value) return undefined;

    try {
        return new URL(value, baseUrl).href;
    } catch {
        return undefined;
    }
}

async function crawlSource(source: Source): Promise<Project[]> {
    const response = await fetch(source.url);

    if (!response.ok) {
        throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
    }

    const html = await response.text();
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
}

const proceedSheetData = (sheetJson: any) => {
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
                dataSet['goals'] = data[i].v;
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

const TOKEN = process.env.GITLAB_TU_PAT || '';

async function main() {
    const all: Project[] = [];

    const gitlabProjects = getAllProjects(GIT_API, TOKEN, MAX_PAGES, PER_PAGE);
    // console.log(gitlabProjects.items.length);

    const items = await proceedGitlabProjects(gitlabProjects.items);
    all.push(...items);

    const sheetJson = await getSheetData(SHEET_ID, SHEET_TAB);
    all.push(...proceedSheetData(sheetJson));

    for (const source of sources) {
        LOG.INFO(`crawl: ${source.url}`);
        all.push(...(await crawlSource(source)));
    }
    const finalData = {
        data: all,
        lastUpdated: new Date().toISOString(),
        $schema: './projects.schema.json',
    };

    // copy projects.schmea
    //   await fs.copyFile('projects.schema.json', 'output/projects.schema.json');

    await fs.mkdir('output', { recursive: true });
    await fs.writeFile(
        'output/projects.json',
        JSON.stringify(finalData, null, 2),
        'utf-8'
    );

    // console.log(`done: ${all.length} projects`);
}

main().catch((error) => {
    LOG.FAIL(error);
    process.exit(1);
});
