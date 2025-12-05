import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Target, Percent, FileText, ArrowUp, ArrowDown, Equal } from 'lucide-react';
import { KPI, KpiType, TargetOperator } from '../types';
import { generateId } from '../utils';

interface Props {
  kpis: KPI[];
  onUpdate: (kpis: KPI[]) => void;
}

export const KpiConfig: React.FC<Props> = ({ kpis, onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<KpiType>('number');
  const [newOp, setNewOp] = useState<TargetOperator>('>=');
  const [newTarget, setNewTarget] = useState<number>(0);
  const [newUnit, setNewUnit] = useState('');

  const addKpi = () => {
    if (!newName) return;
    const newKpi: KPI = {
      id: generateId(),
      name: newName,
      type: newType,
      operator: newOp,
      targetValue: newTarget,
      unit: newUnit,
    };
    onUpdate([...kpis, newKpi]);
    // Reset form
    setNewName('');
    setNewTarget(0);
    setNewUnit('');
  };

  const removeKpi = (id: string) => {
    if (window.confirm('Sunteti sigur ca doriti sa stergeti acest indicator? Toate datele asociate vor fi pierdute.')) {
      onUpdate(kpis.filter(k => k.id !== id));
    }
  };

  const getOperatorLabel = (op: TargetOperator) => {
    switch (op) {
      case '>': return 'Mai mare decat';
      case '>=': return 'Cel putin';
      case '<': return 'Mai mic decat';
      case '<=': return 'Cel mult';
      default: return op;
    }
  };

  return (
    <div className="space-y-8">

      {/* Help Section */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 mb-2">Ce sunt indicatorii de performanta (KPI)?</h4>
            <p className="text-amber-700 text-sm leading-relaxed">
              Indicatorii de performanta sunt metrici pe care le urmariti lunar pentru a masura succesul departamentului.
              De exemplu: <strong>Venituri lunare</strong>, <strong>Numar de clienti noi</strong>, <strong>Rata de satisfactie</strong>, etc.
            </p>
            <p className="text-amber-700 text-sm mt-2">
              Pentru fiecare indicator, stabiliti o <strong>tinta</strong> (valoarea pe care doriti sa o atingeti sau depasiti).
            </p>
          </div>
        </div>
      </div>

      {/* Creator Card */}
      <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Plus className="w-6 h-6 text-blue-600" />
          Adaugati un Indicator Nou
        </h3>

        <div className="space-y-6">
          {/* KPI Name */}
          <div>
            <label className="block text-base font-semibold text-slate-700 mb-2">
              Numele Indicatorului <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 text-lg bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
              placeholder="Exemplu: Venit Lunar, Numar Clienti Noi, Productivitate..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <p className="text-sm text-slate-400 mt-1">Scrieti un nume clar si scurt pentru acest indicator</p>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-base font-semibold text-slate-700 mb-3">
              Tipul de Valoare
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setNewType('number')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${newType === 'number'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${newType === 'number' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Numar</p>
                    <p className="text-xs text-slate-500">Ex: 100, 500, 1000</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNewType('percentage')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${newType === 'percentage'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${newType === 'percentage' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Procent</p>
                    <p className="text-xs text-slate-500">Ex: 85%, 95%</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNewType('text')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${newType === 'text'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${newType === 'text' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Text / Calitativ</p>
                    <p className="text-xs text-slate-500">Feedback descriptiv</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Target Settings - Only for numeric types */}
          {newType !== 'text' && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <label className="block text-base font-semibold text-slate-700 mb-4">
                Stabiliti Tinta
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Operator */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Conditia de succes
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewOp('>=')}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${newOp === '>=' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Cel putin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewOp('<=')}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${newOp === '<=' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-sm font-medium">Cel mult</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewOp('>')}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${newOp === '>' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <span className="text-sm font-medium">Mai mare decat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewOp('<')}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${newOp === '<' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <span className="text-sm font-medium">Mai mic decat</span>
                    </button>
                  </div>
                </div>

                {/* Target Value */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Valoarea Tinta
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full px-4 py-3 text-xl font-mono bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                      placeholder="0"
                      value={newTarget}
                      onChange={e => setNewTarget(parseFloat(e.target.value) || 0)}
                    />
                    {newType === 'percentage' && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">%</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {newOp === '>=' && 'Indicatorul trebuie sa fie CEL PUTIN aceasta valoare pentru a fi considerat atins'}
                    {newOp === '<=' && 'Indicatorul trebuie sa fie CEL MULT aceasta valoare pentru a fi considerat atins'}
                    {newOp === '>' && 'Indicatorul trebuie sa fie MAI MARE decat aceasta valoare'}
                    {newOp === '<' && 'Indicatorul trebuie sa fie MAI MIC decat aceasta valoare'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={addKpi}
            disabled={!newName}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 disabled:shadow-none"
          >
            <Plus className="w-5 h-5" />
            Adauga Indicator
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Indicatorii Adaugati ({kpis.length})
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Acestia sunt indicatorii pe care ii veti completa pentru fiecare luna
          </p>
        </div>

        {kpis.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-lg">Nu ati adaugat inca niciun indicator</p>
            <p className="text-slate-400 text-sm mt-1">Folositi formularul de mai sus pentru a adauga primul indicator</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {kpis.map((kpi, index) => (
              <div key={kpi.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-lg">{kpi.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${kpi.type === 'number' ? 'bg-blue-100 text-blue-700' :
                            kpi.type === 'percentage' ? 'bg-purple-100 text-purple-700' :
                              'bg-slate-100 text-slate-700'
                          }`}>
                          {kpi.type === 'number' ? 'Numar' : kpi.type === 'percentage' ? 'Procent' : 'Text'}
                        </span>
                        {kpi.type !== 'text' && (
                          <span className="text-sm text-slate-500">
                            Tinta: {getOperatorLabel(kpi.operator)} <strong>{kpi.targetValue}{kpi.type === 'percentage' ? '%' : ''}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeKpi(kpi.id)}
                    className="text-red-500 hover:text-red-700 p-3 hover:bg-red-50 rounded-xl transition-colors"
                    title="Sterge indicator"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
