import { getSheetData } from '@robert.tools/google';
import type { Project } from '../../apps/api/api.d';
import type { CONFIG_ITEM } from '../../index.d';
import { getID } from '../utils/utils';
import { DEFAULT_DATA } from '../../index.config';

export const proceedSheetData = (sheetJson: any) => {
    const all: Project[] = [];
    for (const item of sheetJson.table.rows) {
        const data = item.c;
        const dataSet: Partial<Project> = { ...DEFAULT_DATA };
        let i = 0;
        for (const row of sheetJson.table.cols) {
            // dataSet[row.label] = row.context;
            dataSet['id'] = getID(data[0].v.toString());

            const key = row.label.toLowerCase() as keyof Project;
            if (key.indexOf('zeitstempel') > -1) {
                dataSet['last_updated'] = data[i].v;
            } else if (key.indexOf('goal') > -1) {
                dataSet['goals'] = [];
                // split at numbers but include them
                const goals = data[i].v
                    .split(/(\d+\s[^\d]+)/)
                    .filter(Boolean)
                    .map((g: string) => g.trim());
                for (const goal of goals) {
                    const num = goal.match(/(\d+)/);
                    if (num && num[0]) {
                        dataSet['goals']?.push(parseInt(num[0], 10));
                    }
                }
            } else {
                dataSet[key] = data[i].v;
            }
            dataSet['source'] = 'google form';
            data['dimension'] = 'Digital';
            i++;
        }
        all.push(dataSet as Project);
    }
    return all;
};

export const getAllGoogleSheetProjects = (config: CONFIG_ITEM): Project[] => {
    const sheetJson = getSheetData(config.SHEET.ID, config.SHEET.TAB);
    const sheetProjects = proceedSheetData(sheetJson);
    return sheetProjects;
};
