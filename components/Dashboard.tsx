import React, { useMemo } from 'react';
import { KPI, MonthlyData, KpiEntry, AppState } from '../types';
import { formatValue } from '../utils';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertCircle, TrendingUp, Download, CheckCircle, User, Building2 } from 'lucide-react';
import { exportToExcel } from '../services/excelService';

interface Props {
  state: AppState;
}

export const Dashboard: React.FC<Props> = ({ state }) => {
  const { kpis, data, managerName, department } = state;
  const sortedMonths = useMemo(() => Object.keys(data).sort(), [data]);

  // Statistics
  const totalEntries = sortedMonths.reduce((acc, m) => acc + Object.keys(data[m].entries).length, 0);
  const missedTargets = sortedMonths.reduce((acc, m) => {
    return acc + (Object.values(data[m].entries) as KpiEntry[]).filter(e => e.isOutOfTarget).length;
  }, 0);
  
  const complianceRate = totalEntries > 0 
    ? Math.round(((totalEntries - missedTargets) / totalEntries) * 100) 
    : 100;

  const handleExport = () => {
    exportToExcel(state);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start bg-blue-50 p-6 rounded-xl border border-blue-100">
        <div>
          <h2 className="text-xl font-bold text-blue-900">Raport Anual de Performanță</h2>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium bg-blue-100/50 px-3 py-1 rounded-lg">
              <User className="w-4 h-4" /> {managerName || 'Manager Necunoscut'}
            </div>
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium bg-blue-100/50 px-3 py-1 rounded-lg">
              <Building2 className="w-4 h-4" /> {department || 'Departament Necunoscut'}
            </div>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Download className="w-5 h-5" />
          Export Excel
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 uppercase">Rata de Conformitate</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className={`text-4xl font-bold ${complianceRate >= 90 ? 'text-green-600' : 'text-orange-500'}`}>
              {complianceRate}%
            </h3>
            <span className="text-sm text-slate-400 mb-1">ținte atinse</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${complianceRate >= 90 ? 'bg-green-500' : 'bg-orange-500'}`} 
              style={{ width: `${complianceRate}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 uppercase">Acțiuni Necesare</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className="text-4xl font-bold text-red-600">
              {missedTargets}
            </h3>
            <span className="text-sm text-slate-400 mb-1">probleme identificate</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
             <div 
              className="h-full bg-red-500 rounded-full transition-all duration-1000"
              style={{ width: `${totalEntries > 0 ? (missedTargets / totalEntries) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 uppercase">Puncte de Date</p>
          <div className="flex items-end gap-2 mt-2">
            <h3 className="text-4xl font-bold text-blue-600">
              {totalEntries}
            </h3>
            <span className="text-sm text-slate-400 mb-1">înregistrări în {sortedMonths.length} luni</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
             <div className="h-full bg-blue-500 rounded-full w-full opacity-50"></div>
          </div>
        </div>
      </div>

      {/* Charts for Numeric KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            <div key={kpi.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  {kpi.name}
                </h3>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                  Țintă: {kpi.operator} {kpi.targetValue}
                </span>
              </div>
              
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [formatValue(val, kpi.type), 'Realizat']}
                      labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    />
                    <Legend />
                    <ReferenceLine y={kpi.targetValue} stroke="#64748b" strokeDasharray="3 3" label={{ position: 'top',  value: 'Țintă', fill: '#64748b', fontSize: 10 }} />
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

      {/* Detailed Action Plan Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-slate-800">Plan de Remediere Detaliat</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Perioadă</th>
                <th className="px-6 py-4">Indicator</th>
                <th className="px-6 py-4">Analiză</th>
                <th className="px-6 py-4">Acțiune</th>
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
                        <tr key={`${m}-${k.id}`} className="hover:bg-red-50/20 group">
                          <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">
                             {new Date(m + '-01').toLocaleDateString('ro-RO', { month: 'long' })}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800">{k.name}</td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="text-red-600 font-bold">{formatValue(e.value, k.type)}</span>
                               <span className="text-slate-400 text-xs">Țintă: {k.operator}{k.targetValue}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 max-w-xs truncate group-hover:whitespace-normal group-hover:overflow-visible">
                            {e.actionTask || <span className="text-red-300 italic">Nicio acțiune definită</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {e.responsible && (
                              <div className="flex items-center gap-1">
                                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                  {e.responsible.charAt(0)}
                                </span>
                                {e.responsible}
                              </div>
                            )}
                          </td>
                           <td className="px-6 py-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                               e.status === 'Done' ? 'bg-green-100 text-green-800' :
                               e.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                               'bg-slate-100 text-slate-800'
                             }`}>
                               {e.status === 'Done' ? 'Finalizat' : e.status === 'In Progress' ? 'În Lucru' : 'Deschis'}
                             </span>
                          </td>
                        </tr>
                      );
                    }
                  });
                });
                return rows.length > 0 ? rows : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center">
                      <CheckCircle className="w-12 h-12 text-green-100 mb-2" />
                      <p>Scor perfect! Nu sunt necesare acțiuni.</p>
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