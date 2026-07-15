import type { CONFIG_ITEM } from '../../index.d';
import type { Project } from './api.d';

import { LOG } from '@robert.tools/log';
import { FS } from '@robert.tools/fs';

import { getAllProjectsFromSources } from '../../_shared/homepage/homepage';
import { getAllGitlabProjects } from '../../_shared/gitlab/gitlab';
import { getAllGoogleSheetProjects } from '../../_shared/google/google';
import { getProjectsFromDemoData } from '../../_shared/demo/demo';
import { DEMO_PROJECTS } from './demo.data';
import { enrichProjectDocument } from './project-enricher/project-enricher';

export const add = (items: Project[], target: Project[], ctx: string) => {
    target.push(...items);
    LOG.OK(`[${ctx}] added ${items.length} items, total: ${target.length}`);
};

export const getProjects = async (config: CONFIG_ITEM) => {
    try {
        const data: Project[] = [];
        const lastUpdated = new Date().toISOString();
        const schemaFile = 'projects.schema.json';
        const $schema = `./${schemaFile}`;

        // add projects from different sources
        add(getProjectsFromDemoData(DEMO_PROJECTS), data, 'demo data');
        add(getAllGoogleSheetProjects(config), data, 'google sheet');
        add(getAllGitlabProjects(config), data, 'gitlab');
        add(getAllProjectsFromSources(config.SOURCES), data, 'homepage');
        const finalData = await enrichProjectDocument({
            data,
            lastUpdated,
            $schema,
        });
        // copy projects.schmea
        //   await fs.copyFile('projects.schema.json', 'output/projects.schema.json');
        FS.writeFile(config.FILE, JSON.stringify(finalData, null, 2));
        const schemaData: string = FS.readFile(schemaFile) as string;
        FS.writeFile(`output/${schemaFile}`, schemaData);
        LOG.OK(`done: ${data.length} projects written to ${config.FILE}`);
    } catch (error: any) {
        LOG.FAIL(error);
        process.exit(1);
    }
};
