import { create } from 'zustand';

import { getReports, getReportsCount } from '../lib/appwrite';

export type ReportItem = {
    $id: string;
    $createdAt?: string;
    reason?: string;
    details?: string;
    reporterID?: any;
    adId?: any;
};

interface ReportsState {
    reports: ReportItem[];
    reportsCount: number;
    isLoading: boolean;
    error: string | null;
    fetchReports: (limit?: number) => Promise<ReportItem[]>;
    fetchReportsCount: () => Promise<number>;
    refreshReports: (limit?: number) => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
    reports: [],
    reportsCount: 0,
    isLoading: false,
    error: null,

    fetchReports: async (limit = 50) => {
        set({ isLoading: true, error: null });
        try {
            const data = await getReports(limit);
            const reports = data as ReportItem[];
            set({ reports, isLoading: false });
            return reports;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            return [];
        }
    },

    fetchReportsCount: async () => {
        try {
            const count = await getReportsCount();
            set({ reportsCount: count });
            return count;
        } catch (error: any) {
            set({ reportsCount: 0 });
            return 0;
        }
    },

    refreshReports: async (limit = 50) => {
        await Promise.all([get().fetchReports(limit), get().fetchReportsCount()]);
    }
}));
