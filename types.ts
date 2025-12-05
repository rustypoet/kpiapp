
export type KpiType = 'number' | 'percentage' | 'text';
export type TargetOperator = '>' | '<' | '>=' | '<=' | 'exists';

export interface KPI {
  id: string;
  name: string;
  type: KpiType;
  operator: TargetOperator;
  targetValue: number; // For text, we might ignore this or use it as a flag
  unit?: string;
  description?: string;
}

export interface KpiEntry {
  kpiId: string;
  value: number | string; // Text KPIs have string values
  note?: string; // Subjective feedback
  isOutOfTarget: boolean;
  actionTask?: string; // The mandatory task if out of target
  responsible?: string;
  dueDate?: string;
  status?: 'Open' | 'In Progress' | 'Done';
}

export interface MonthlyQualitative {
  activityStatus: string;
  trends: string;
  risks: string;
  needsHigh: string;
  needsMedium: string;
  needsLow: string;
  improvements: string;
}

export interface MonthlyData {
  monthStr: string; // Format: "YYYY-MM"
  entries: Record<string, KpiEntry>; // Map kpiId -> Entry
  qualitative?: MonthlyQualitative;
}

export interface AppState {
  managerName: string;
  department: string;
  kpis: KPI[];
  data: Record<string, MonthlyData>; // Map monthStr -> MonthlyData
  projectName: string;
}
