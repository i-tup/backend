export type Status = 'current' | 'completed' | 'unknown';

export type Source = {
    url: string;
    institution: string;
    status: Status;
};

export type Project = {
    id: string;
    name: string;
    description: string;
    building: string;
    co2e: number;
    lead: string;
    base: number;
    cost: number;
    eur: number;
    kpi: {
        carbon: number;
        cost: number;
        sdg: number;
        lockin: number;
        data: number;
    };
    synenergies: [string, string][];
    dimension: string;
    image?: string;
    url?: string;
    institution: string;
    status: Status;
    source: string;
    goals: number[];
    last_updated?: string;
};
