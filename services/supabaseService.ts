import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from '../types';

// Supabase configuration - these should be set in your environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET || 'kpi-reports';

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabase;
};

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Convert app state to CSV format
export const convertToCSV = (state: AppState): string => {
  const rows: string[] = [];

  // Header row
  rows.push([
    'Luna',
    'Departament',
    'Manager',
    'KPI_Nume',
    'KPI_Tip',
    'Tinta',
    'Operator',
    'Valoare_Realizata',
    'Status',
    'Actiune_Corectiva',
    'Responsabil',
    'Termen',
    'Status_Actiune'
  ].join(','));

  // Sort months
  const sortedMonths = Object.keys(state.data).sort();

  // Data rows
  sortedMonths.forEach(monthStr => {
    const monthData = state.data[monthStr];
    state.kpis.forEach(kpi => {
      const entry = monthData.entries[kpi.id];
      if (entry) {
        const row = [
          monthStr,
          `"${(state.department || '').replace(/"/g, '""')}"`,
          `"${(state.managerName || '').replace(/"/g, '""')}"`,
          `"${(kpi.name || '').replace(/"/g, '""')}"`,
          kpi.type,
          kpi.targetValue,
          kpi.operator,
          typeof entry.value === 'string' ? `"${entry.value.replace(/"/g, '""')}"` : entry.value,
          entry.isOutOfTarget ? 'Sub_Tinta' : 'Atins',
          `"${(entry.actionTask || '').replace(/"/g, '""')}"`,
          `"${(entry.responsible || '').replace(/"/g, '""')}"`,
          entry.dueDate || '',
          entry.status || 'Open'
        ];
        rows.push(row.join(','));
      }
    });
  });

  return rows.join('\n');
};

// Upload CSV to Supabase bucket
export const uploadCSVToSupabase = async (
  state: AppState
): Promise<{ success: boolean; message: string; url?: string }> => {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      message: 'Supabase nu este configurat. Contactați administratorul pentru setarea conexiunii.'
    };
  }

  try {
    // Generate CSV content
    const csvContent = convertToCSV(state);

    // Create blob from CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeDepartment = (state.department || 'Dept').replace(/[^a-zA-Z0-9]/g, '_');
    const safeManager = (state.managerName || 'Manager').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeDepartment}_${safeManager}_${timestamp}.csv`;

    // Upload to Supabase bucket
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filename, blob, {
        contentType: 'text/csv',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        message: `Eroare la salvare: ${error.message}`
      };
    }

    // Get public URL if bucket is public
    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return {
      success: true,
      message: 'Raportul a fost salvat cu succes!',
      url: urlData?.publicUrl
    };

  } catch (err) {
    console.error('Upload error:', err);
    return {
      success: false,
      message: 'A apărut o eroare neașteptată la salvare. Încercați din nou.'
    };
  }
};

// Download CSV locally (fallback when Supabase is not configured)
export const downloadCSVLocally = (state: AppState): void => {
  const csvContent = convertToCSV(state);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const timestamp = new Date().toISOString().slice(0, 10);
  const safeDepartment = (state.department || 'Dept').replace(/[^a-zA-Z0-9]/g, '_');
  const safeManager = (state.managerName || 'Manager').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safeDepartment}_${safeManager}_${timestamp}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
