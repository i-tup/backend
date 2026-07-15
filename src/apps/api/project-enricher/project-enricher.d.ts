import type { Project } from '../api.d';

export type ProjectDocument = {
    data: Project[];
    lastUpdated?: string;
    $schema?: string;
};

export type EnricherConfig = {
    enabled: boolean;
    apiKey: string;
    model: string;
    maxItems: number;
    maxCostUsd: number;
    maxCostPerItemUsd: number;
    inputUsdPerMillion: number;
    outputUsdPerMillion: number;
    maxOutputTokens: number;
    dryRun: boolean;
};

export type CostInfo = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    inputCostUsd: number;
    outputCostUsd: number;
    totalCostUsd: number;
};
