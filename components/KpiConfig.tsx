import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { KPI, KpiType, TargetOperator } from '../types';
import { generateId } from '../utils';

interface Props {
  kpis: KPI[];
  onUpdate: (kpis: KPI[]) => void;
}

export const KpiConfig: React.FC<Props> = ({ kpis, onUpdate }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<KpiType>('number');
  const [newOp, setNewOp] = useState<TargetOperator>('>');
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
    if (window.confirm('Ești sigur? Această acțiune va șterge și datele asociate.')) {
      onUpdate(kpis.filter(k => k.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configurare Indicatori (KPI)</h2>
          <p className="text-slate-500">Definiți metricile urmărite și țintele de performanță.</p>
        </div>
      </div>

      {/* Creator Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Adaugă Indicator Nou
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nume KPI</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ex. Venit Lunar"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
            <select 
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={newType}
              onChange={e => setNewType(e.target.value as KpiType)}
            >
              <option value="number">Număr (#)</option>
              <option value="percentage">Procent (%)</option>
              <option value="text">Subiectiv (Text)</option>
            </select>
          </div>
          
          {newType !== 'text' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Regulă Țintă</label>
                <select 
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={newOp}
                  onChange={e => setNewOp(e.target.value as TargetOperator)}
                >
                  <option value=">">Mai mare ca &gt;</option>
                  <option value=">=">Minim &ge;</option>
                  <option value="<">Mai mic ca &lt;</option>
                  <option value="<=">Maxim &le;</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valoare Țintă</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  value={newTarget}
                  onChange={e => setNewTarget(parseFloat(e.target.value))}
                />
              </div>
            </>
          )}

          <div className="md:col-span-1">
             <button 
              onClick={addKpi}
              disabled={!newName}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              Adaugă
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Nume</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Tip</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Țintă</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kpis.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                  Nu sunt indicatori definiți. Adaugă unul mai sus.
                </td>
              </tr>
            )}
            {kpis.map(kpi => (
              <tr key={kpi.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{kpi.name}</td>
                <td className="px-6 py-4 text-slate-600 capitalize">
                  {kpi.type === 'number' ? 'Număr' : kpi.type === 'percentage' ? 'Procent' : 'Text'}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {kpi.type === 'text' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Feedback Subiectiv
                    </span>
                  ) : (
                    <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {kpi.operator} {kpi.targetValue}{kpi.type === 'percentage' ? '%' : ''}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => removeKpi(kpi.id)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                    title="Șterge KPI"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};