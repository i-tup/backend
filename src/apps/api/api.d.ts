export type Status = 'current' | 'completed' | 'unknown';

export type Source = {
    url: string;
    institution: string;
    status: Status;
};

export type Project = {
    name: string;
    description: string;
    image?: string;
    url: string;
    institution: string;
    status: Status;
    source: string;
    goals: string[];
    lastUpdated?: string;
};
