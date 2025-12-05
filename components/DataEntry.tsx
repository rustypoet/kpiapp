
import React, { useMemo } from 'react';
import { KPI, MonthlyData, KpiEntry, MonthlyQualitative } from '../types';
import { checkIsOutOfTarget } from '../utils';
import { User, Calendar, Clock, AlertTriangle, ClipboardList, TrendingUp, AlertOctagon, Lightbulb } from 'lucide-react';

interface Props {
  kpis: KPI[];
  data: Record<string, MonthlyData>;
  month: string;
  onSaveEntry: (month: string, kpiId: string, entry: KpiEntry) => void;
  onSaveQualitative: (month: string, data: MonthlyQualitative) => void;
}

export const DataEntry: React.FC<Props> = ({ kpis, data, month, onSaveEntry, onSaveQualitative }) => {
  const currentMonthData = useMemo(() => {
    return data[month]?.entries || {};
  }, [data, month]);

  const qualitative = useMemo(() => {
    return data[month]?.qualitative || {
      activityStatus: '',
      trends: '',
      risks: '',
      needsHigh: '',
      needsMedium: '',
      needsLow: '',
      improvements: ''
    };
  }, [data, month]);

  const updateEntry = (kpiId: string, updates: Partial<KpiEntry>) => {
    const existing = currentMonthData[kpiId];
    const base: KpiEntry = existing || {
      kpiId,
      value: '',
      isOutOfTarget: false
    };
    onSaveEntry(month, kpiId, { ...base, ...updates });
  };

  const handleValueChange = (kpi: KPI, value: string) => {
    const isOutOfTarget = checkIsOutOfTarget(value, kpi);
    updateEntry(kpi.id, { 
      value, 
      isOutOfTarget,
    });
  };

  const toggleManualStatus = (kpiId: string, currentStatus: boolean) => {
    updateEntry(kpiId, { isOutOfTarget: !currentStatus });
  }

  const handleQualitativeChange = (field: keyof MonthlyQualitative, value: string) => {
    onSaveQualitative(month, {
      ...qualitative,
      [field]: value
    });
  };

  const monthName = new Date(month + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      {/* SECTION 1: KPIS */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">1. Indicatori de Performanță (KPI)</h2>
        <div className="grid grid-cols-1 gap-8">
          {kpis.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">Niciun KPI configurat.</p>
            </div>
          )}
          
          {kpis.map(kpi => {
            const entry = currentMonthData[kpi.id];
            const hasValue = entry && entry.value !== undefined && entry.value !== '';
            const isOutOfTarget = entry?.isOutOfTarget;

            return (
              <div 
                key={kpi.id} 
                className={`bg-white rounded-xl border shadow-sm transition-all duration-300 overflow-hidden ${
                  isOutOfTarget ? 'border-red-200 shadow-red-50 ring-1 ring-red-100' : 'border-slate-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* LEFT: Metric Input */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-10 rounded-full ${hasValue ? (isOutOfTarget ? 'bg-red-500' : 'bg-green-500') : 'bg-slate-200'}`}></div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg">{kpi.name}</h3>
                            {kpi.type !== 'text' && (
                              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-1">
                                <span className="bg-slate-100 px-2 py-0.5 rounded">Țintă: {kpi.operator} {kpi.targetValue}{kpi.type === 'percentage' ? '%' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Realizat - {monthName}
                        </label>
                        
                        {kpi.type === 'text' ? (
                           <div className="space-y-3">
                             <textarea
                               className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[80px]"
                               placeholder="Introduceți feedback calitativ..."
                               value={entry?.value || ''}
                               onChange={(e) => handleValueChange(kpi, e.target.value)}
                             />
                             <div className="flex items-center gap-2">
                               <input 
                                 type="checkbox"
                                 id={`oot-${kpi.id}`}
                                 checked={isOutOfTarget || false}
                                 onChange={() => toggleManualStatus(kpi.id, isOutOfTarget || false)}
                                 className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                               />
                               <label htmlFor={`oot-${kpi.id}`} className="text-sm text-slate-600 cursor-pointer">
                                 Necesită Plan de Acțiune / Nesatisfăcător
                               </label>
                             </div>
                           </div>
                        ) : (
                          <div className="relative group">
                            <input
                              type="number"
                              className={`w-full text-3xl font-mono px-4 py-4 bg-white border rounded-lg focus:ring-2 transition-all outline-none ${
                                isOutOfTarget 
                                  ? 'border-red-300 text-red-700 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                                  : 'border-slate-200 text-slate-900 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="-"
                              value={entry?.value ?? ''}
                              onChange={(e) => handleValueChange(kpi, e.target.value)}
                            />
                            {kpi.type === 'percentage' && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl pointer-events-none">%</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Action Plan (Conditional) */}
                    <div className={`flex-1 transition-all duration-500 ease-in-out ${isOutOfTarget ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4 grayscale pointer-events-none hidden lg:block'}`}>
                      <div className={`h-full p-5 rounded-xl border ${isOutOfTarget ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-2 mb-4">
                           <AlertTriangle className={`w-5 h-5 ${isOutOfTarget ? 'text-red-600' : 'text-slate-400'}`} />
                           <h4 className={`font-bold ${isOutOfTarget ? 'text-red-800' : 'text-slate-500'}`}>
                             Plan de Acțiune Necesar
                           </h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Măsuri Corective</label>
                            <textarea
                              className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none h-20"
                              placeholder="Ce măsuri vor fi luate?"
                              value={entry?.actionTask || ''}
                              onChange={(e) => updateEntry(kpi.id, { actionTask: e.target.value })}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Responsabil
                              </label>
                              <input 
                                type="text"
                                className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-red-500"
                                placeholder="Nume"
                                value={entry?.responsible || ''}
                                onChange={(e) => updateEntry(kpi.id, { responsible: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Termen
                              </label>
                              <input 
                                type="date"
                                className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-red-500"
                                value={entry?.dueDate || ''}
                                onChange={(e) => updateEntry(kpi.id, { dueDate: e.target.value })}
                              />
                            </div>
                          </div>

                          <div>
                             <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Status
                              </label>
                              <select
                                className="w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-200 rounded-md focus:ring-2 focus:ring-red-500"
                                value={entry?.status || 'Open'}
                                onChange={(e) => updateEntry(kpi.id, { status: e.target.value as any })}
                              >
                                <option value="Open">Deschis</option>
                                <option value="In Progress">În Lucru</option>
                                <option value="Done">Finalizat</option>
                              </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: QUALITATIVE REPORT */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
          2. Raport Calitativ & Sinteză <span className="text-xs font-normal text-slate-500 ml-auto uppercase tracking-widest border border-slate-200 px-2 py-1 rounded">Secțiune Nouă</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* LEFT COL */}
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-blue-800">
                  <ClipboardList className="w-5 h-5" />
                  <h3 className="font-bold">Status Activități & Proiecte</h3>
                </div>
                <textarea 
                  className="w-full h-32 px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Sumar executiv al activităților lunii curente..."
                  value={qualitative.activityStatus}
                  onChange={e => handleQualitativeChange('activityStatus', e.target.value)}
                />
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-purple-800">
                  <TrendingUp className="w-5 h-5" />
                  <h3 className="font-bold">Tendințe & Direcții</h3>
                </div>
                <textarea 
                  className="w-full h-32 px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  placeholder="Ce tendințe observați? Încotro se îndreaptă lucrurile?"
                  value={qualitative.trends}
                  onChange={e => handleQualitativeChange('trends', e.target.value)}
                />
              </div>
           </div>

           {/* RIGHT COL */}
           <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-orange-800">
                  <AlertOctagon className="w-5 h-5" />
                  <h3 className="font-bold">Riscuri Identificate</h3>
                </div>
                <textarea 
                  className="w-full h-32 px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  placeholder="Blocaje potențiale, riscuri operaționale..."
                  value={qualitative.risks}
                  onChange={e => handleQualitativeChange('risks', e.target.value)}
                />
              </div>

               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-green-800">
                  <Lightbulb className="w-5 h-5" />
                  <h3 className="font-bold">Propuneri Îmbunătățire</h3>
                </div>
                <textarea 
                  className="w-full h-32 px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  placeholder="Idei pentru optimizarea proceselor..."
                  value={qualitative.improvements}
                  onChange={e => handleQualitativeChange('improvements', e.target.value)}
                />
              </div>
           </div>
        </div>

        {/* NEEDS SECTION */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4">Nevoile Departamentului (Categorizate)</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                 <label className="block text-xs font-bold text-red-600 uppercase mb-2">Prioritate Ridicată (High)</label>
                 <textarea 
                    className="w-full h-24 px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded focus:ring-2 focus:ring-red-500 text-sm"
                    placeholder="Resurse critice lipsă..."
                    value={qualitative.needsHigh}
                    onChange={e => handleQualitativeChange('needsHigh', e.target.value)}
                 />
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500 shadow-sm">
                 <label className="block text-xs font-bold text-yellow-600 uppercase mb-2">Prioritate Medie</label>
                 <textarea 
                    className="w-full h-24 px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded focus:ring-2 focus:ring-yellow-500 text-sm"
                    placeholder="Necesități pe termen mediu..."
                    value={qualitative.needsMedium}
                    onChange={e => handleQualitativeChange('needsMedium', e.target.value)}
                 />
              </div>
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                 <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Prioritate Scăzută</label>
                 <textarea 
                    className="w-full h-24 px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Nice to have..."
                    value={qualitative.needsLow}
                    onChange={e => handleQualitativeChange('needsLow', e.target.value)}
                 />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
