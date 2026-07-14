import { getProjects } from './apps/api/api';
import { CONFIG } from './index.config';
import { LOG } from '@robert.tools/log';

getProjects(CONFIG);
LOG.OK(`CONFIGX: ${JSON.stringify(CONFIG, null, 2)}`);
