import type { Project, Source } from './apps/api/api.d';

// src/index.ts
import { getSheetData } from './_shared/google/google';
import { getAllProjects } from './_shared/gitlab/gitlab';
import { getProjectsFromHTML, proceedGitlabProjects } from './apps/api/api';
import { LOG } from './_shared/log/log';
import {
    GIT_API,
    MAX_PAGES,
    PER_PAGE,
    sources,
    SHEET_ID,
    SHEET_TAB,
} from './index.config';
import { FS } from './_shared/fs/fs';
import { command } from './_shared/cmd/cmd';

const crawlSource = (source: Source): Project[] => {
    const html = command(`curl -s "${source.url}"`);

    const projects: Project[] = getProjectsFromHTML(html, source);
    return projects;
};

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

const FILE = 'output/projects.json';

function main() {
    try {
        const all: Project[] = [];
        const gitlabProjects = getAllProjects(
            GIT_API,
            TOKEN,
            MAX_PAGES,
            PER_PAGE
        );
        // console.log(gitlabProjects.items.length);
        const items = proceedGitlabProjects(gitlabProjects.items);
        all.push(...items);
        const sheetJson = getSheetData(SHEET_ID, SHEET_TAB);
        const sheetProjects = proceedSheetData(sheetJson);
        LOG.OK(`sheetProjects: ${sheetProjects.length}`);
        all.push(...sheetProjects);
        for (const source of sources) {
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
        FS.writeFile(FILE, JSON.stringify(finalData, null, 2));
        LOG.OK(`done: ${all.length} projects written to ${FILE}`);
    } catch (error: any) {
        LOG.FAIL(error);
        process.exit(1);
    }
}

main();
