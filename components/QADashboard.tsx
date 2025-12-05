import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Users, Filter, ArrowLeft, AlertTriangle, TrendingUp, Cloud, Download, RefreshCw, Trash2, Calendar, User, Building2 } from 'lucide-react';
import { AppState, KpiEntry } from '../types';
import { importFromExcel } from '../services/excelService';
import { formatValue } from '../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseService';

interface Props {
  onBack: () => void;
}

interface BucketFile {
  name: string;
  created_at: string;
  updated_at: string;
  size: number;
}

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#db2777'];

export const QADashboard: React.FC<Props> = ({ onBack }) => {
  const [datasets, setDatasets] = useState<AppState[]>([]);
  const [filterDept, setFilterDept] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [bucketFiles, setBucketFiles] = useState<BucketFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files from Supabase bucket on mount
  useEffect(() => {
    loadBucketFiles();
  }, []);

  // Auto-load CSV files into datasets when bucketFiles changes
  useEffect(() => {
    if (bucketFiles.length > 0) {
      loadAllCSVData();
    }
  }, [bucketFiles]);

  const loadBucketFiles = async () => {
    if (!isSupabaseConfigured()) return;

    setLoadingFiles(true);
    try {
      const client = getSupabaseClient();
      if (!client) return;

      const { data, error } = await client.storage
        .from('kpi-reports')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error loading files:', error);
        return;
      }

      setBucketFiles(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Parse CSV content into AppState format
  const parseCSVToAppState = (csvContent: string, filename: string): AppState | null => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) return null;

      const headers = lines[0].split(',');
      const dataRows = lines.slice(1);

      // Extract department and manager from filename or first row
      const parsed = parseFileName(filename);
      let department = parsed.department;
      let managerName = parsed.manager;

      // Build KPIs and data from CSV
      const kpisMap = new Map<string, any>();
      const monthlyData: Record<string, any> = {};

      dataRows.forEach(line => {
        // Parse CSV line (handle quoted values)
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        if (values.length < 9) return;

        const [luna, dept, manager, kpiName, kpiType, tinta, operator, valoare, status, actiune, responsabil, termen, statusActiune] = values;

        // Update department/manager from data if available
        if (dept && dept !== '""') department = dept.replace(/"/g, '');
        if (manager && manager !== '""') managerName = manager.replace(/"/g, '');

        // Create KPI if not exists
        const kpiId = kpiName.replace(/"/g, '').replace(/\s+/g, '_').toLowerCase();
        if (!kpisMap.has(kpiId)) {
          kpisMap.set(kpiId, {
            id: kpiId,
            name: kpiName.replace(/"/g, ''),
            type: kpiType || 'number',
            operator: operator || '>=',
            targetValue: parseFloat(tinta) || 0
          });
        }

        // Create monthly entry
        if (!monthlyData[luna]) {
          monthlyData[luna] = { monthStr: luna, entries: {} };
        }

        monthlyData[luna].entries[kpiId] = {
          kpiId,
          value: isNaN(parseFloat(valoare)) ? valoare.replace(/"/g, '') : parseFloat(valoare),
          isOutOfTarget: status === 'Sub_Tinta' || status === 'Ratat',
          actionTask: actiune?.replace(/"/g, '') || '',
          responsible: responsabil?.replace(/"/g, '') || '',
          dueDate: termen || '',
          status: statusActiune || 'Open'
        };
      });

      return {
        department,
        managerName,
        projectName: 'Imported from CSV',
        kpis: Array.from(kpisMap.values()),
        data: monthlyData
      };
    } catch (err) {
      console.error('Error parsing CSV:', err);
      return null;
    }
  };

  // Load all CSV files and parse them into datasets
  const loadAllCSVData = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    setIsLoading(true);
    const newDatasets: AppState[] = [];

    for (const file of bucketFiles) {
      if (!file.name.endsWith('.csv')) continue;

      try {
        const { data, error } = await client.storage
          .from('kpi-reports')
          .download(file.name);

        if (error) {
          console.error('Error downloading:', file.name, error);
          continue;
        }

        const csvContent = await data.text();
        const appState = parseCSVToAppState(csvContent, file.name);

        if (appState && appState.kpis.length > 0) {
          newDatasets.push(appState);
        }
      } catch (err) {
        console.error('Error processing:', file.name, err);
      }
    }

    setDatasets(newDatasets);
    setIsLoading(false);
  };

  const downloadFile = async (filename: string) => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data, error } = await client.storage
        .from('kpi-reports')
        .download(filename);

      if (error) {
        console.error('Download error:', error);
        alert('Eroare la descarcarea fisierului');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteFile = async (filename: string) => {
    if (!confirm(`Sunteti sigur ca doriti sa stergeti fisierul "${filename}"?`)) return;

    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client.storage
        .from('kpi-reports')
        .remove([filename]);

      if (error) {
        console.error('Delete error:', error);
        alert('Eroare la stergerea fisierului');
        return;
      }

      // Refresh file list
      loadBucketFiles();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseFileName = (filename: string) => {
    // Format: Department_Manager_timestamp.csv
    const parts = filename.replace('.csv', '').split('_');
    if (parts.length >= 3) {
      return {
        department: parts[0].replace(/_/g, ' '),
        manager: parts[1].replace(/_/g, ' '),
        date: parts.slice(2).join('_')
      };
    }
    return { department: 'Unknown', manager: 'Unknown', date: '' };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsLoading(true);
      const files: File[] = Array.from(e.target.files);
      try {
        const promises = files.map(f => importFromExcel(f));
        const results = await Promise.all(promises);
        setDatasets(prev => [...prev, ...results]);
      } catch (err) {
        console.error(err);
        alert('Eroare la importul unor fișiere. Asigurați-vă că sunt fișiere valide.');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const departments = useMemo(() => {
    const depts = new Set(datasets.map(d => d.department).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    if (filterDept === 'All') return datasets;
    return datasets.filter(d => d.department === filterDept);
  }, [datasets, filterDept]);

  // Define months for headers
  const monthHeaders = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(year, i, 1);
      return {
        key: `${year}-${(i + 1).toString().padStart(2, '0')}`,
        short: d.toLocaleDateString('ro-RO', { month: 'short' }).toUpperCase(),
        full: d.toLocaleDateString('ro-RO', { month: 'long' })
      };
    });
  }, []);

  // Prepare Chart Data
  const chartData = useMemo(() => {
    return monthHeaders.map(m => {
      const point: any = { name: m.short };

      filteredDatasets.forEach(ds => {
        const deptName = ds.department || 'Unknown';

        let total = 0;
        let missed = 0;

        ds.kpis.forEach(kpi => {
           const entry = ds.data[m.key]?.entries[kpi.id];
           if (entry) {
             total++;
             if (entry.isOutOfTarget) missed++;
           }
        });

        if (total > 0) {
          point[deptName] = Math.round(((total - missed) / total) * 100);
        } else {
          point[deptName] = null; // No data point for gap in line
        }
      });

      return point;
    });
  }, [monthHeaders, filteredDatasets]);

  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
          <div>
             <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               <Users className="w-8 h-8 text-blue-600" />
               Panou Control Calitate (QA Master)
             </h1>
             <p className="text-slate-500">Vizualizare consolidată și urmărire planuri de acțiune.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium px-4 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Înapoi
            </button>

            <div className="relative group">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Import Excel Local
              </button>
              <input
                type="file"
                multiple
                accept=".xlsx"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        {/* Supabase Files Section */}
        {supabaseReady && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="font-bold text-slate-800">Rapoarte Salvate in Cloud</h2>
                  <p className="text-sm text-slate-500">Toate rapoartele trimise de managerii de departament</p>
                </div>
              </div>
              <button
                onClick={loadBucketFiles}
                disabled={loadingFiles}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                Reincarca
              </button>
            </div>

            {loadingFiles ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Se incarca fisierele...</p>
              </div>
            ) : bucketFiles.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">Nu exista rapoarte salvate inca</p>
                <p className="text-sm text-slate-400 mt-1">Rapoartele vor aparea aici dupa ce managerii le trimit</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bucketFiles.map((file) => {
                  const parsed = parseFileName(file.name);
                  return (
                    <div key={file.name} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{file.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {parsed.department}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {parsed.manager}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(file.created_at)}
                              </span>
                              <span>{formatFileSize(file.size)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => downloadFile(file.name)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Descarca"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteFile(file.name)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sterge"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Local Excel Analysis Section */}
        {isLoading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">Se incarca datele...</h3>
            <p className="text-slate-400 mt-2">Analizam rapoartele din cloud</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <FileSpreadsheet className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">Analiza Detaliata</h3>
            <p className="text-slate-400 max-w-lg mx-auto mt-2">
              {bucketFiles.length === 0
                ? 'Nu exista rapoarte in cloud. Datele vor aparea automat dupa ce managerii trimit rapoartele.'
                : 'Importati fisierele Excel pentru analiza detaliata sau asteptati incarcarea automata din cloud.'}
            </p>
          </div>
        ) : (
          <>
            {/* Filter */}
            <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm w-fit">
               <Filter className="w-4 h-4 text-slate-400" />
               <span className="text-sm font-bold text-slate-700">Filtru Departament:</span>
               <select
                 value={filterDept}
                 onChange={(e) => setFilterDept(e.target.value)}
                 className="bg-slate-50 border border-slate-200 text-slate-900 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
               >
                 <option value="All">Toate Departamentele</option>
                 {departments.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
               </select>
            </div>

            {/* CHART SECTION */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Trenduri de Conformitate (Departamente)</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                      labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
                    />
                    <Legend />
                    {filteredDatasets.map((ds, index) => (
                      <Line
                        key={ds.department}
                        type="monotone"
                        dataKey={ds.department}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Matrix View per Dataset */}
            <div className="space-y-12">
              {filteredDatasets.map((dataset, idx) => {
                // Calculate dataset stats
                let totalEntries = 0;
                let missedEntries = 0;
                const flattenedEntries: {month: string, entry: KpiEntry}[] = [];

                dataset.kpis.forEach(kpi => {
                  monthHeaders.forEach(m => {
                    const entry = dataset.data[m.key]?.entries[kpi.id];
                    if (entry) {
                      totalEntries++;
                      if (entry.isOutOfTarget) missedEntries++;
                      flattenedEntries.push({ month: m.key, entry });
                    }
                  });
                });

                const compliance = totalEntries > 0 ? Math.round(((totalEntries - missedEntries) / totalEntries) * 100) : 100;

                return (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Dataset Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                           {dataset.department ? dataset.department.charAt(0).toUpperCase() : '?'}
                         </div>
                         <div>
                           <h2 className="text-xl font-bold text-slate-800">{dataset.department || 'Departament Necunoscut'}</h2>
                           <div className="flex items-center gap-2 text-sm text-slate-500">
                             <span className="font-semibold text-slate-700">Manager:</span> {dataset.managerName || '-'}
                           </div>
                         </div>
                       </div>

                       <div className="flex items-center gap-6">
                         <div className="text-right">
                           <div className="text-xs text-slate-500 font-bold uppercase">Rata Conformitate</div>
                           <div className={`text-2xl font-bold ${compliance >= 90 ? 'text-green-600' : 'text-red-600'}`}>
                             {compliance}%
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="text-xs text-slate-500 font-bold uppercase">Acțiuni Deschise</div>
                           <div className="text-2xl font-bold text-orange-500">
                             {flattenedEntries.filter(e => e.entry.isOutOfTarget && e.entry.status !== 'Done').length}
                           </div>
                         </div>
                       </div>
                    </div>

                    {/* Matrix Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 p-3 text-left w-64 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                              Indicator (KPI)
                            </th>
                            <th className="bg-slate-50 border-b border-r border-slate-200 p-2 text-center w-24">
                              Țintă
                            </th>
                            {monthHeaders.map(m => (
                              <th key={m.key} className="bg-slate-50 border-b border-slate-200 p-2 text-center min-w-[140px]">
                                {m.short}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataset.kpis.map(kpi => (
                            <tr key={kpi.id} className="hover:bg-slate-50/50">
                              <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-200 p-3 font-medium text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <div className="truncate" title={kpi.name}>{kpi.name}</div>
                              </td>
                              <td className="border-b border-r border-slate-200 p-2 text-center font-mono text-xs text-slate-500">
                                {kpi.type !== 'text' ? `${kpi.operator} ${kpi.targetValue}${kpi.type === 'percentage' ? '%' : ''}` : 'Text'}
                              </td>
                              {monthHeaders.map(m => {
                                const entry = dataset.data[m.key]?.entries[kpi.id];
                                if (!entry) {
                                  return <td key={m.key} className="border-b border-slate-200 p-2 text-center text-slate-300">-</td>;
                                }

                                const isMissed = entry.isOutOfTarget;

                                return (
                                  <td key={m.key} className={`border-b border-slate-200 p-2 align-top transition-colors ${isMissed ? 'bg-red-50' : ''}`}>
                                    <div className="flex flex-col items-center gap-1">
                                      {/* Value */}
                                      <span className={`font-bold ${isMissed ? 'text-red-700' : 'text-slate-700'}`}>
                                        {formatValue(entry.value, kpi.type)}
                                      </span>

                                      {/* Action Plan Preview if Missed */}
                                      {isMissed && (
                                        <div className="w-full mt-1 text-left bg-white border border-red-100 rounded p-2 shadow-sm text-xs">
                                          <div className="flex items-center gap-1 text-red-600 font-bold mb-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Acțiune:
                                          </div>
                                          <div className="text-slate-600 line-clamp-3 mb-1 leading-tight" title={entry.actionTask}>
                                            {entry.actionTask || 'Nicio acțiune specificată'}
                                          </div>
                                          {(entry.responsible || entry.dueDate) && (
                                            <div className="pt-1 border-t border-red-50 mt-1 flex flex-col gap-0.5 text-[10px] text-slate-400">
                                              {entry.responsible && <span>Resp: {entry.responsible}</span>}
                                              {entry.dueDate && <span>Termen: {entry.dueDate}</span>}
                                            </div>
                                          )}
                                          <div className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${
                                            entry.status === 'Done' ? 'text-green-600' :
                                            entry.status === 'In Progress' ? 'text-blue-600' : 'text-orange-500'
                                          }`}>
                                            {entry.status === 'Done' ? 'Finalizat' : entry.status === 'In Progress' ? 'În Lucru' : 'Deschis'}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
