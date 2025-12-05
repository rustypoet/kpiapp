import React, { useMemo, useState } from 'react';
import { KPI, MonthlyData, KpiEntry, AppState } from '../types';
import { formatValue } from '../utils';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertCircle, TrendingUp, Download, CheckCircle, User, Building2, CloudUpload, Loader2, CheckCircle2, XCircle, FileDown } from 'lucide-react';
import { exportToExcel } from '../services/excelService';
import { uploadCSVToSupabase, downloadCSVLocally, isSupabaseConfigured } from '../services/supabaseService';

interface Props {
  state: AppState;
}

export const Dashboard: React.FC<Props> = ({ state }) => {
  const { kpis, data, managerName, department } = state;
  const sortedMonths = useMemo(() => Object.keys(data).sort(), [data]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Statistics
  const totalEntries = sortedMonths.reduce((acc, m) => acc + Object.keys(data[m].entries).length, 0);
  const missedTargets = sortedMonths.reduce((acc, m) => {
    return acc + (Object.values(data[m].entries) as KpiEntry[]).filter(e => e.isOutOfTarget).length;
  }, 0);

  const complianceRate = totalEntries > 0
    ? Math.round(((totalEntries - missedTargets) / totalEntries) * 100)
    : 100;

  const handleExportExcel = () => {
    exportToExcel(state);
  };

  const handleSaveToCloud = async () => {
    setIsUploading(true);
    setUploadStatus(null);

    try {
      const result = await uploadCSVToSupabase(state);
      setUploadStatus(result);
    } catch (error) {
      setUploadStatus({
        success: false,
        message: 'A aparut o eroare neasteptata. Va rugam incercati din nou.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadCSV = () => {
    downloadCSVLocally(state);
  };

  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Success Banner */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-800">Felicitari! Ati completat raportul!</h2>
            <p className="text-green-700 mt-1">
              Mai jos puteti vedea un rezumat al datelor introduse. Nu uitati sa salvati raportul!
            </p>
          </div>
        </div>
      </div>

      {/* Manager Info */}
      <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">Informatii Raport</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-slate-500">Manager</p>
              <p className="font-semibold text-slate-800">{managerName || 'Nespecificat'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-slate-500">Departament</p>
              <p className="font-semibold text-slate-800">{department || 'Nespecificat'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Actions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 text-lg mb-2">Salvati Raportul</h3>
        <p className="text-blue-700 mb-6">
          Pentru a finaliza, salvati raportul folosind unul din butoanele de mai jos.
          <strong> Recomandam sa apasati pe "Trimite Raportul"</strong> pentru a salva automat in sistem.
        </p>

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${uploadStatus.success
              ? 'bg-green-100 border border-green-300'
              : 'bg-red-100 border border-red-300'
            }`}>
            {uploadStatus.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <p className={uploadStatus.success ? 'text-green-800' : 'text-red-800'}>
              {uploadStatus.message}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary: Save to Supabase */}
          <button
            onClick={handleSaveToCloud}
            disabled={isUploading || !supabaseReady}
            className={`p-5 rounded-xl font-bold text-lg flex flex-col items-center gap-3 transition-all ${supabaseReady
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <CloudUpload className="w-8 h-8" />
            )}
            <span>{isUploading ? 'Se salveaza...' : 'Trimite Raportul'}</span>
            <span className="text-sm font-normal opacity-80">
              {supabaseReady ? 'Salvare automata in sistem' : 'Sistemul nu este configurat'}
            </span>
          </button>

          {/* Secondary: Download CSV */}
          <button
            onClick={handleDownloadCSV}
            className="p-5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 font-bold text-lg flex flex-col items-center gap-3 transition-all text-slate-700"
          >
            <FileDown className="w-8 h-8 text-slate-600" />
            <span>Descarca CSV</span>
            <span className="text-sm font-normal text-slate-500">Format simplu pentru Excel</span>
          </button>

          {/* Tertiary: Download Excel */}
          <button
            onClick={handleExportExcel}
            className="p-5 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 font-bold text-lg flex flex-col items-center gap-3 transition-all text-slate-700"
          >
            <Download className="w-8 h-8 text-slate-600" />
            <span>Descarca Excel</span>
            <span className="text-sm font-normal text-slate-500">Format complet cu toate datele</span>
          </button>
        </div>

        {!supabaseReady && (
          <p className="text-sm text-amber-700 mt-4 bg-amber-50 p-3 rounded-lg">
            Nota: Salvarea automata in sistem nu este configurata. Contactati administratorul pentru activare.
            Intre timp, puteti descarca raportul folosind butoanele "Descarca CSV" sau "Descarca Excel".
          </p>
        )}
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
          <p className="text-sm font-semibold text-slate-500 uppercase">Rata de Conformitate</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className={`text-5xl font-bold ${complianceRate >= 90 ? 'text-green-600' : complianceRate >= 70 ? 'text-orange-500' : 'text-red-500'}`}>
              {complianceRate}%
            </h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">din tinte au fost atinse</p>
          <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${complianceRate >= 90 ? 'bg-green-500' : complianceRate >= 70 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${complianceRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
          <p className="text-sm font-semibold text-slate-500 uppercase">Indicatori Sub Tinta</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className={`text-5xl font-bold ${missedTargets === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {missedTargets}
            </h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">necesita plan de actiune</p>
          <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-1000"
              style={{ width: `${totalEntries > 0 ? (missedTargets / totalEntries) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
          <p className="text-sm font-semibold text-slate-500 uppercase">Date Completate</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className="text-5xl font-bold text-blue-600">
              {totalEntries}
            </h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">inregistrari in {sortedMonths.length} luni</p>
          <div className="w-full bg-slate-100 rounded-full h-3 mt-3">
            <div className="h-full bg-blue-500 rounded-full w-full opacity-50"></div>
          </div>
        </div>
      </div>

      {/* Charts for Numeric KPIs */}
      {kpis.filter(k => k.type !== 'text').length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4">Evolutia Indicatorilor</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {kpis.filter(k => k.type !== 'text').map(kpi => {
              // Prepare data for chart
              const chartData = sortedMonths.map(m => {
                const entry = data[m].entries[kpi.id];
                return {
                  name: new Date(m + '-01').toLocaleDateString('ro-RO', { month: 'short' }),
                  value: entry ? parseFloat(entry.value as string) : null,
                  target: kpi.targetValue,
                  isMissed: entry?.isOutOfTarget
                };
              });

              return (
                <div key={kpi.id} className="bg-white p-6 rounded-xl border-2 border-slate-200 flex flex-col h-[350px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      {kpi.name}
                    </h3>
                    <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                      Tinta: {kpi.operator} {kpi.targetValue}{kpi.type === 'percentage' ? '%' : ''}
                    </span>
                  </div>

                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(val: number) => [formatValue(val, kpi.type), 'Realizat']}
                          labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                        />
                        <Legend />
                        <ReferenceLine y={kpi.targetValue} stroke="#64748b" strokeDasharray="3 3" label={{ position: 'top', value: 'Tinta', fill: '#64748b', fontSize: 10 }} />
                        <Bar
                          dataKey="value"
                          name="Valoare"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isMissed ? '#ef4444' : '#3b82f6'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Action Plan Table */}
      <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="font-bold text-slate-800">Planuri de Actiune</h3>
            <p className="text-sm text-slate-500">Lista indicatorilor care nu au atins tinta si actiunile planificate</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Luna</th>
                <th className="px-6 py-4">Indicator</th>
                <th className="px-6 py-4">Rezultat</th>
                <th className="px-6 py-4">Actiune Planificata</th>
                <th className="px-6 py-4">Responsabil</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const rows: any[] = [];
                sortedMonths.forEach(m => {
                  kpis.forEach(k => {
                    const e = data[m].entries[k.id];
                    if (e && e.isOutOfTarget) {
                      rows.push(
                        <tr key={`${m}-${k.id}`} className="hover:bg-red-50/30">
                          <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                            {new Date(m + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{k.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-red-600 font-bold">{formatValue(e.value, k.type)}</span>
                              <span className="text-slate-400 text-xs">Tinta: {k.operator}{k.targetValue}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 max-w-xs">
                            {e.actionTask || <span className="text-red-400 italic">Nicio actiune definita</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {e.responsible ? (
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                  {e.responsible.charAt(0).toUpperCase()}
                                </span>
                                {e.responsible}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${e.status === 'Done' ? 'bg-green-100 text-green-800' :
                                e.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-slate-100 text-slate-700'
                              }`}>
                              {e.status === 'Done' ? 'Finalizat' : e.status === 'In Progress' ? 'In Lucru' : 'Neînceput'}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  });
                });
                return rows.length > 0 ? rows : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-green-200 mb-3" />
                        <p className="text-lg font-semibold text-green-600">Excelent!</p>
                        <p className="text-slate-500">Toate tintele au fost atinse. Nu sunt necesare actiuni corective.</p>
                      </div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
