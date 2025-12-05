
import React, { useMemo } from 'react';
import { KPI, MonthlyData, KpiEntry, MonthlyQualitative } from '../types';
import { checkIsOutOfTarget } from '../utils';
import { User, Calendar, Clock, AlertTriangle, ClipboardList, TrendingUp, AlertOctagon, Lightbulb, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

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

  // Calculate completed indicators
  const completedCount = kpis.filter(kpi => {
    const entry = currentMonthData[kpi.id];
    return entry && entry.value !== undefined && entry.value !== '';
  }).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">

      {/* Progress for this month */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Completati datele pentru {monthName}</h3>
              <p className="text-sm text-blue-700">Ati completat {completedCount} din {kpis.length} indicatori</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{completedCount}/{kpis.length}</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: KPIS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Indicatorii de Performanta</h2>
            <p className="text-slate-500 mt-1">Introduceti valoarea realizata pentru fiecare indicator in aceasta luna</p>
          </div>
        </div>

        <div className="space-y-6">
          {kpis.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-500 text-lg">Nu ati definit niciun indicator</p>
              <p className="text-slate-400 text-sm mt-1">Intoarceti-va la pasul anterior pentru a adauga indicatori</p>
            </div>
          )}

          {kpis.map((kpi, index) => {
            const entry = currentMonthData[kpi.id];
            const hasValue = entry && entry.value !== undefined && entry.value !== '';
            const isOutOfTarget = entry?.isOutOfTarget;

            return (
              <div
                key={kpi.id}
                className={`bg-white rounded-xl border-2 shadow-sm transition-all duration-300 overflow-hidden ${isOutOfTarget ? 'border-red-300 shadow-red-50' : hasValue ? 'border-green-300' : 'border-slate-200'
                  }`}
              >
                {/* Status Header */}
                <div className={`px-6 py-3 flex items-center justify-between ${isOutOfTarget ? 'bg-red-50' : hasValue ? 'bg-green-50' : 'bg-slate-50'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isOutOfTarget ? 'bg-red-500 text-white' : hasValue ? 'bg-green-500 text-white' : 'bg-slate-300 text-white'
                      }`}>
                      {index + 1}
                    </div>
                    <span className="font-semibold text-slate-700">{kpi.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasValue && !isOutOfTarget && (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Tinta atinsa
                      </span>
                    )}
                    {isOutOfTarget && (
                      <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                        <XCircle className="w-4 h-4" /> Sub tinta - completati planul de actiune
                      </span>
                    )}
                    {!hasValue && (
                      <span className="text-slate-400 text-sm">Asteptam valoarea</span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT: Metric Input */}
                    <div className="flex-1 space-y-4">
                      {kpi.type !== 'text' && (
                        <div className="bg-slate-50 p-3 rounded-lg inline-flex items-center gap-2 text-sm">
                          <span className="text-slate-500">Tinta stabilita:</span>
                          <span className="font-bold text-slate-700">
                            {kpi.operator === '>=' && 'cel putin '}
                            {kpi.operator === '<=' && 'cel mult '}
                            {kpi.operator === '>' && 'mai mare de '}
                            {kpi.operator === '<' && 'mai mic de '}
                            {kpi.targetValue}{kpi.type === 'percentage' ? '%' : ''}
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="block text-base font-semibold text-slate-700 mb-2">
                          Valoarea Realizata in {monthName}
                        </label>

                        {kpi.type === 'text' ? (
                          <div className="space-y-3">
                            <textarea
                              className="w-full px-4 py-3 text-base bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all min-h-[100px]"
                              placeholder="Descrieti situatia, rezultatele obtinute, observatii relevante..."
                              value={entry?.value || ''}
                              onChange={(e) => handleValueChange(kpi, e.target.value)}
                            />
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                              <input
                                type="checkbox"
                                id={`oot-${kpi.id}`}
                                checked={isOutOfTarget || false}
                                onChange={() => toggleManualStatus(kpi.id, isOutOfTarget || false)}
                                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                              />
                              <label htmlFor={`oot-${kpi.id}`} className="text-sm text-slate-600 cursor-pointer">
                                <strong>Bifati aceasta casuta</strong> daca rezultatul NU este satisfacator si necesita un plan de actiune
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="number"
                              className={`w-full text-4xl font-mono px-5 py-5 bg-white border-2 rounded-xl focus:ring-4 transition-all outline-none ${isOutOfTarget
                                  ? 'border-red-300 text-red-700 focus:ring-red-100 focus:border-red-500 bg-red-50'
                                  : hasValue
                                    ? 'border-green-300 text-green-700 focus:ring-green-100 focus:border-green-500'
                                    : 'border-slate-200 text-slate-900 focus:ring-blue-100 focus:border-blue-500'
                                }`}
                              placeholder="Introduceti valoarea"
                              value={entry?.value ?? ''}
                              onChange={(e) => handleValueChange(kpi, e.target.value)}
                            />
                            {kpi.type === 'percentage' && (
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-2xl pointer-events-none">%</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Action Plan (Only visible when out of target) */}
                    {isOutOfTarget && (
                      <div className="flex-1">
                        <div className="h-full p-5 rounded-xl bg-red-50 border-2 border-red-200">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            <h4 className="font-bold text-red-800 text-lg">
                              Plan de Actiune Obligatoriu
                            </h4>
                          </div>

                          <p className="text-sm text-red-700 mb-4">
                            Deoarece indicatorul nu a atins tinta, trebuie sa completati un plan de actiune pentru remediere.
                          </p>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Ce masuri veti lua pentru a remedia situatia?
                              </label>
                              <textarea
                                className="w-full px-4 py-3 text-sm bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-red-100 focus:border-red-500 resize-none h-24"
                                placeholder="Descrieti actiunile concrete pe care le veti intreprinde..."
                                value={entry?.actionTask || ''}
                                onChange={(e) => updateEntry(kpi.id, { actionTask: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                  <User className="w-4 h-4" /> Cine este responsabil?
                                </label>
                                <input
                                  type="text"
                                  className="w-full px-4 py-3 text-sm bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-red-100"
                                  placeholder="Numele persoanei responsabile"
                                  value={entry?.responsible || ''}
                                  onChange={(e) => updateEntry(kpi.id, { responsible: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                  <Calendar className="w-4 h-4" /> Pana cand?
                                </label>
                                <input
                                  type="date"
                                  className="w-full px-4 py-3 text-sm bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-red-100"
                                  value={entry?.dueDate || ''}
                                  onChange={(e) => updateEntry(kpi.id, { dueDate: e.target.value })}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Status curent
                              </label>
                              <select
                                className="w-full px-4 py-3 text-sm bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-red-100"
                                value={entry?.status || 'Open'}
                                onChange={(e) => updateEntry(kpi.id, { status: e.target.value as any })}
                              >
                                <option value="Open">Inca nu am inceput</option>
                                <option value="In Progress">In curs de implementare</option>
                                <option value="Done">Actiunea a fost finalizata</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: QUALITATIVE REPORT */}
      <div className="space-y-6">
        <div className="border-t-2 border-slate-200 pt-8">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Analiza Calitativa (Optional)</h2>
              <p className="text-slate-500 mt-1">
                Aceasta sectiune va permite sa adaugati observatii si comentarii despre activitatea departamentului.
                Completarea este optionala, dar ajuta la o intelegere mai buna a situatiei.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT COL */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-3 text-blue-800">
                <ClipboardList className="w-5 h-5" />
                <h3 className="font-bold">Ce activitati s-au desfasurat?</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3">Rezumati principalele activitati si proiecte din aceasta luna</p>
              <textarea
                className="w-full h-28 px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-none"
                placeholder="De exemplu: Am finalizat proiectul X, am initiat colaborarea cu Y..."
                value={qualitative.activityStatus}
                onChange={e => handleQualitativeChange('activityStatus', e.target.value)}
              />
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-3 text-purple-800">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-bold">Ce tendinte observati?</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3">Ce directii sau schimbari observati in departament sau piata?</p>
              <textarea
                className="w-full h-28 px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-purple-100 focus:border-purple-500 resize-none"
                placeholder="De exemplu: Observam o crestere a cererii pentru..., echipa devine mai eficienta in..."
                value={qualitative.trends}
                onChange={e => handleQualitativeChange('trends', e.target.value)}
              />
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-3 text-orange-800">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="font-bold">Exista riscuri sau probleme?</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3">Identificati potentiale blocaje sau riscuri pentru urmatoarea perioada</p>
              <textarea
                className="w-full h-28 px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-orange-100 focus:border-orange-500 resize-none"
                placeholder="De exemplu: Riscam intarzieri din cauza..., lipsa de personal in zona..."
                value={qualitative.risks}
                onChange={e => handleQualitativeChange('risks', e.target.value)}
              />
            </div>

            <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-3 text-green-800">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-bold">Aveti propuneri de imbunatatire?</h3>
              </div>
              <p className="text-sm text-slate-500 mb-3">Ce idei aveti pentru a imbunatati rezultatele sau procesele?</p>
              <textarea
                className="w-full h-28 px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-green-100 focus:border-green-500 resize-none"
                placeholder="De exemplu: Am putea automatiza procesul de..., propun sa testam..."
                value={qualitative.improvements}
                onChange={e => handleQualitativeChange('improvements', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* NEEDS SECTION */}
        <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-200">
          <div className="flex items-start gap-3 mb-4">
            <HelpCircle className="w-5 h-5 text-slate-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-800">De ce resurse aveti nevoie?</h3>
              <p className="text-sm text-slate-500">Listati resursele sau suportul de care aveti nevoie, grupate pe prioritate</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm">
              <label className="block text-sm font-bold text-red-600 uppercase mb-2">Urgent / Prioritate Maxima</label>
              <textarea
                className="w-full h-24 px-3 py-2 bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-red-100 text-sm"
                placeholder="Ce aveti nevoie urgent?"
                value={qualitative.needsHigh}
                onChange={e => handleQualitativeChange('needsHigh', e.target.value)}
              />
            </div>
            <div className="bg-white p-4 rounded-xl border-l-4 border-yellow-500 shadow-sm">
              <label className="block text-sm font-bold text-yellow-600 uppercase mb-2">Important / Prioritate Medie</label>
              <textarea
                className="w-full h-24 px-3 py-2 bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-yellow-100 text-sm"
                placeholder="Ce ar fi util pe termen mediu?"
                value={qualitative.needsMedium}
                onChange={e => handleQualitativeChange('needsMedium', e.target.value)}
              />
            </div>
            <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
              <label className="block text-sm font-bold text-blue-600 uppercase mb-2">De Dorit / Prioritate Scazuta</label>
              <textarea
                className="w-full h-24 px-3 py-2 bg-white text-slate-900 border-2 border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-100 text-sm"
                placeholder="Ce ar fi frumos sa aveti?"
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
