import type {
    CostInfo,
    EnricherConfig,
    ProjectDocument,
} from './project-enricher.d';
import type { Project } from '../api.d';

import { LOG } from '@robert.tools/log';

type ProjectPatch = {
    co2e?: number | null;
    base?: number | null;
    cost?: number | null;
    eur?: number | null;
    goals?: number[] | null;
    kpi?: Partial<Project['kpi']> | null;
};

const KPI_FIELDS: Array<keyof Project['kpi']> = [
    'carbon',
    'cost',
    'sdg',
    'lockin',
    'data',
];

const OPTIONAL_NUMBER_FIELDS: Array<
    keyof Pick<Project, 'co2e' | 'base' | 'cost' | 'eur'>
> = ['co2e', 'base', 'cost', 'eur'];

const numberEnv = (name: string, fallback: number): number => {
    const value = process.env[name];

    if (value === undefined || value === '') {
        return fallback;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed) || parsed < 0) {
        throw new Error(
            `Invalid numeric environment variable ${name}: ${value}`
        );
    }

    return parsed;
};

const createConfig = (): EnricherConfig => ({
    enabled:
        process.env.OPENAI_ENRICH_ENABLED === 'true' ||
        process.env.DRY_RUN === 'true',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    maxItems: numberEnv('MAX_ITEMS', Number.POSITIVE_INFINITY),
    maxCostUsd: numberEnv('MAX_COST_USD', 0.1),
    maxCostPerItemUsd: numberEnv('MAX_COST_PER_ITEM_USD', 0.02),
    inputUsdPerMillion: numberEnv('OPENAI_INPUT_USD_PER_MILLION', 0.25),
    outputUsdPerMillion: numberEnv('OPENAI_OUTPUT_USD_PER_MILLION', 2),
    maxOutputTokens: numberEnv('MAX_OUTPUT_TOKENS', 900),
    dryRun: process.env.DRY_RUN === 'true',
});

const isMissingNumber = (value: unknown): boolean =>
    typeof value !== 'number' || !Number.isFinite(value) || value <= 0;

const isMissingGoals = (value: unknown): boolean =>
    !Array.isArray(value) || value.length === 0;

const getMissingFields = (project: Project): string[] => {
    const missing: string[] = [];

    for (const field of OPTIONAL_NUMBER_FIELDS) {
        if (isMissingNumber(project[field])) {
            missing.push(field);
        }
    }

    for (const field of KPI_FIELDS) {
        if (isMissingNumber(project.kpi?.[field])) {
            missing.push(`kpi.${field}`);
        }
    }

    if (isMissingGoals(project.goals)) {
        missing.push('goals');
    }

    return missing;
};

const createPrompt = (project: Project, missingFields: string[]): string => {
    const compactProject = {
        id: project.id,
        name: project.name,
        description: project.description,
        building: project.building,
        lead: project.lead,
        institution: project.institution,
        dimension: project.dimension,
        status: project.status,
        source: project.source,
        url: project.url || null,
        currentValues: {
            co2e: project.co2e,
            base: project.base,
            cost: project.cost,
            eur: project.eur,
            kpi: project.kpi,
            goals: project.goals,
        },
        missingFields,
    };

    return [
        'Return one JSON object only. No markdown. No explanation.',
        'Use null for unknown numeric values.',
        'Fill missing kpi and goals.',
        'Try co2e, base, cost, eur only when obvious from the given data.',
        'KPI values must be integers from 0 to 100.',
        'goals must be unique integers from 1 to 17.',
        JSON.stringify(compactProject),
        'Expected JSON shape:',
        '{"co2e":null,"base":null,"cost":null,"eur":null,"goals":[],"kpi":{"carbon":null,"cost":null,"sdg":null,"lockin":null,"data":null}}',
    ].join('\n');
};

const estimateTokens = (text: string): number => Math.ceil(text.length / 3);

const calculateCost = (
    inputTokens: number,
    outputTokens: number,
    config: EnricherConfig
): CostInfo => {
    const inputCostUsd = (inputTokens / 1_000_000) * config.inputUsdPerMillion;
    const outputCostUsd =
        (outputTokens / 1_000_000) * config.outputUsdPerMillion;

    return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        inputCostUsd,
        outputCostUsd,
        totalCostUsd: inputCostUsd + outputCostUsd,
    };
};

const estimateMaximumCost = (
    prompt: string,
    config: EnricherConfig
): CostInfo =>
    calculateCost(estimateTokens(prompt), config.maxOutputTokens, config);

const extractOutputText = (response: any): string => {
    if (response.output_text) {
        return response.output_text;
    }

    const texts = response.output
        ?.flatMap((item: any) => item.content ?? [])
        .filter((item: any) => item.type === 'output_text')
        .map((item: any) => item.text);

    const output = texts?.join('').trim();

    if (!output) {
        throw new Error('OpenAI returned no text output.');
    }

    return output;
};

const extractJsonObject = (text: string): string | null => {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fenced?.[1]) {
        return fenced[1].trim();
    }

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
        return null;
    }

    return text.slice(start, end + 1);
};

const callOpenAI = async (
    prompt: string,
    config: EnricherConfig
): Promise<{ patch: ProjectPatch | null; cost: CostInfo }> => {
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            authorization: `Bearer ${config.apiKey}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: config.model,
            instructions:
                'Return only a compact JSON object. No markdown. No explanations.',
            input: prompt,
            max_output_tokens: config.maxOutputTokens,
            store: false,
        }),
    });

    const rawBody = await response.text();
    let data: any;

    try {
        data = JSON.parse(rawBody) as any;
    } catch {
        throw new Error(
            `OpenAI returned invalid JSON response: ${rawBody.slice(0, 500)}`
        );
    }

    if (!response.ok) {
        throw new Error(
            data.error?.message ?? `OpenAI request failed: ${response.status}`
        );
    }

    const outputText = extractOutputText(data);
    const patchText = extractJsonObject(outputText);
    const inputTokens = data.usage?.input_tokens ?? estimateTokens(prompt);
    const outputTokens =
        data.usage?.output_tokens ?? estimateTokens(outputText);

    if (!patchText) {
        return {
            patch: null,
            cost: calculateCost(inputTokens, outputTokens, config),
        };
    }

    try {
        return {
            patch: JSON.parse(patchText) as ProjectPatch,
            cost: calculateCost(inputTokens, outputTokens, config),
        };
    } catch {
        return {
            patch: null,
            cost: calculateCost(inputTokens, outputTokens, config),
        };
    }
};

const sanitizeScore = (value: unknown): number | null => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
    }

    const score = Math.round(value);

    if (score < 0 || score > 100) {
        return null;
    }

    return score;
};

const sanitizeNumber = (value: unknown): number | null => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return null;
    }

    return value;
};

const sanitizeGoals = (value: unknown): number[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    const goals = value
        .filter((item): item is number => Number.isInteger(item))
        .filter((item) => item >= 1 && item <= 17);

    return Array.from(new Set(goals)).sort((a, b) => a - b);
};

const sanitizePatch = (patch: ProjectPatch): ProjectPatch => ({
    co2e: sanitizeNumber(patch.co2e),
    base: sanitizeNumber(patch.base),
    cost: sanitizeNumber(patch.cost),
    eur: sanitizeNumber(patch.eur),
    goals: sanitizeGoals(patch.goals),
    kpi: {
        carbon: sanitizeScore(patch.kpi?.carbon),
        cost: sanitizeScore(patch.kpi?.cost),
        sdg: sanitizeScore(patch.kpi?.sdg),
        lockin: sanitizeScore(patch.kpi?.lockin),
        data: sanitizeScore(patch.kpi?.data),
    },
});

const applyPatch = (project: Project, patch: ProjectPatch): Project => {
    const result = structuredClone(project);
    const cleanPatch = sanitizePatch(patch);

    for (const field of OPTIONAL_NUMBER_FIELDS) {
        if (
            isMissingNumber(result[field]) &&
            cleanPatch[field] !== null &&
            cleanPatch[field] !== undefined
        ) {
            result[field] = cleanPatch[field] as never;
        }
    }

    for (const field of KPI_FIELDS) {
        const patchValue = cleanPatch.kpi?.[field];

        if (
            isMissingNumber(result.kpi[field]) &&
            patchValue !== null &&
            patchValue !== undefined
        ) {
            result.kpi[field] = patchValue;
        }
    }

    if (
        isMissingGoals(result.goals) &&
        cleanPatch.goals &&
        cleanPatch.goals.length > 0
    ) {
        result.goals = cleanPatch.goals;
    }

    return result;
};

const money = (value: number): string => `$${value.toFixed(6)}`;

export const enrichProjectDocument = async (
    document: ProjectDocument
): Promise<ProjectDocument> => {
    LOG.INFO('load enrichment')
    const config = createConfig();
    LOG.INFO(`enabled: ${config.enabled}`);
    LOG.INFO(`env enabled: ${process.env.OPENAI_ENRICH_ENABLED}`);
    LOG.INFO(`env key: ${process.env.OPENAI_API_KEY.length}`);
    LOG.INFO(`model: ${config.model}`);

    if (!config.enabled) {
        LOG.OK('[openai enrich] skipped, OPENAI_ENRICH_ENABLED is not true');
        return document;
    }

    if (!config.apiKey && !config.dryRun) {
        LOG.WARN('[openai enrich] skipped, OPENAI_API_KEY is missing');
        return document;
    }

    LOG.OK('start enrichment')
    const result: Project[] = [];
    let totalCostUsd = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let processed = 0;
    let skipped = 0;

    LOG.OK(
        `[openai enrich] model=${config.model}, items=${document.data.length}, dryRun=${config.dryRun}`
    );

    for (let index = 0; index < document.data.length; index++) {
        const project = document.data[index];
        const missingFields = getMissingFields(project);
        const label = project.name || project.id || `item-${index + 1}`;

        if (missingFields.length === 0 || processed >= config.maxItems) {
            result.push(project);
            skipped++;
            continue;
        }

        const prompt = createPrompt(project, missingFields);
        const estimatedMaximum = estimateMaximumCost(prompt, config);

        if (estimatedMaximum.totalCostUsd > config.maxCostPerItemUsd) {
            LOG.WARN(
                `[openai enrich] skip ${label}: item limit ${money(config.maxCostPerItemUsd)} < ${money(estimatedMaximum.totalCostUsd)}`
            );
            result.push(project);
            skipped++;
            continue;
        }

        if (totalCostUsd + estimatedMaximum.totalCostUsd > config.maxCostUsd) {
            LOG.WARN(
                `[openai enrich] stop before ${label}: total limit ${money(config.maxCostUsd)} reached`
            );
            result.push(...document.data.slice(index));
            break;
        }

        if (config.dryRun) {
            LOG.OK(
                `[openai enrich] dry ${label}: ${missingFields.join(', ')}; max ${money(estimatedMaximum.totalCostUsd)}`
            );
            result.push(project);
            processed++;
            continue;
        }

        try {
            const { patch, cost } = await callOpenAI(prompt, config);

            result.push(patch ? applyPatch(project, patch) : project);
            processed++;
            totalCostUsd += cost.totalCostUsd;
            totalInputTokens += cost.inputTokens;
            totalOutputTokens += cost.outputTokens;

            if (!patch) {
                LOG.WARN(
                    `[openai enrich] ${label}: model response had no complete JSON object`
                );
                continue;
            }

            LOG.OK(
                `[openai enrich] ${label}: ${missingFields.join(', ')} | ${cost.inputTokens} in, ${cost.outputTokens} out, total ${money(totalCostUsd)}`
            );
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : String(error);
            LOG.FAIL(`[openai enrich] ${label}: ${message}`);
            result.push(project);
        }
    }

    LOG.OK(
        `[openai enrich] processed=${processed}, skipped=${skipped}, tokens=${totalInputTokens + totalOutputTokens}, cost=${money(totalCostUsd)}`
    );

    return {
        ...document,
        data: result,
    };
};
