
import React, { useState, useMemo, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { KpiConfig } from './components/KpiConfig';
import { QADashboard } from './components/QADashboard';
import { AppState, KPI, KpiEntry, MonthlyQualitative } from './types';
import { importFromExcel } from './services/excelService';
import { ChevronRight, ChevronLeft, Upload, FileSpreadsheet, PlayCircle, User, Building2, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  // Wizard State
  // Step 0: Landing
  // Step 1: Config
  // Step 2..13: Months (Jan..Dec)
  // Step 14: Dashboard
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'manager' | 'qa'>('manager');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate months for the current year
  const months = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(year, i, 1);
      // Returns format "YYYY-MM"
      const monthStr = `${year}-${(i + 1).toString().padStart(2, '0')}`;
      return {
        id: monthStr,
        name: d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
      };
    });
  }, []);

  const [state, setState] = useState<AppState>({
    managerName: '',
    department: '',
    kpis: [],
    data: {},
    projectName: 'Performanta Departament'
  });

  // Landing Page Inputs
  const handleIdentityChange = (field: 'managerName' | 'department', value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const startNew = () => {
    if (!state.managerName || !state.department) return;
    setCurrentStep(1);
  };

  const startQA = () => {
    setMode('qa');
  };

  // State Helpers
  const handleUpdateKpis = (newKpis: KPI[]) => {
    setState(prev => ({ ...prev, kpis: newKpis }));
  };

  const handleSaveEntry = (month: string, kpiId: string, entry: KpiEntry) => {
    setState(prev => {
      const monthData = prev.data[month] || { monthStr: month, entries: {} };
      return {
        ...prev,
        data: {
          ...prev.data,
          [month]: {
            ...monthData,
            entries: {
              ...monthData.entries,
              [kpiId]: entry
            }
          }
        }
      };
    });
  };

  const handleSaveQualitative = (month: string, qualitative: MonthlyQualitative) => {
    setState(prev => {
      const monthData = prev.data[month] || { monthStr: month, entries: {} };
      return {
        ...prev,
        data: {
          ...prev.data,
          [month]: {
            ...monthData,
            qualitative
          }
        }
      };
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const newState = await importFromExcel(file);
        setState(newState);
        // Jump to dashboard if imported
        setCurrentStep(14);
      } catch (err) {
        alert('Eșec la import.');
      }
    }
  };

  // Navigation
  const nextStep = () => setCurrentStep(p => Math.min(p + 1, 14));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 0));

  // Determine Title based on Step
  let stepTitle = "";
  if (currentStep === 1) stepTitle = "Pasul 1: Definire Indicatori (KPI)";
  else if (currentStep >= 2 && currentStep <= 13) stepTitle = `Raportare: ${months[currentStep - 2].name}`;
  else if (currentStep === 14) stepTitle = "Rezultate Finale";

  // RENDER QA MODE
  if (mode === 'qa') {
    return <QADashboard onBack={() => setMode('manager')} />;
  }

  // RENDER CONTENT
  const renderContent = () => {
    // 0. Landing
    if (currentStep === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in zoom-in duration-500">
           <div className="text-center space-y-4 max-w-2xl">
             <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-200">
               <FileSpreadsheet className="w-10 h-10 text-white" />
             </div>
             <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Centralizator KPI</h1>
             <p className="text-slate-500 text-lg">
               Centralizați datele de performanță, monitorizați deficitele și generați planuri de acțiune.
             </p>
           </div>

           {/* Role Selection / Identification */}
           <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
             
             {/* LEFT: Manager Flow */}
             <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Manager Departament
                  </h3>
                  <p className="text-sm text-slate-400">Completați raportul lunar de performanță.</p>
                </div>
                
                <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-semibold text-slate-600 mb-1">Numele Tău</label>
                     <input 
                       type="text" 
                       className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="ex. Ion Popescu"
                       value={state.managerName}
                       onChange={e => handleIdentityChange('managerName', e.target.value)}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-slate-600 mb-1">Departament</label>
                     <input 
                       type="text" 
                       className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                       placeholder="ex. Vânzări, Logistică..."
                       value={state.department}
                       onChange={e => handleIdentityChange('department', e.target.value)}
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                   <button 
                     onClick={startNew}
                     disabled={!state.managerName || !state.department}
                     className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                   >
                     <PlayCircle className="w-5 h-5" /> Start Nou
                   </button>
                   <div className="relative">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        <Upload className="w-5 h-5" /> Continuă
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".xlsx" className="hidden" />
                   </div>
                </div>
             </div>

             {/* RIGHT: QA Flow */}
             <div className="bg-slate-900 p-8 rounded-2xl shadow-xl flex flex-col justify-between text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10">
                   <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                     <BarChart3 className="w-5 h-5 text-blue-400" />
                     Vedere QA / Master
                   </h3>
                   <p className="text-slate-400 text-sm">
                     Combinați mai multe rapoarte Excel pentru a analiza performanța globală și a urmări planurile de acțiune.
                   </p>
                </div>

                <div className="relative z-10 mt-8">
                  <button 
                    onClick={startQA}
                    className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/50"
                  >
                    Deschide Panoul QA <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
             </div>

           </div>
        </div>
      );
    }

    // 1. Config
    if (currentStep === 1) {
      return (
        <div className="space-y-8">
          <KpiConfig kpis={state.kpis} onUpdate={handleUpdateKpis} />
        </div>
      );
    }

    // 2..13. Months
    if (currentStep >= 2 && currentStep <= 13) {
      const monthIndex = currentStep - 2;
      const currentMonth = months[monthIndex];
      return (
        <DataEntry 
          kpis={state.kpis} 
          data={state.data} 
          month={currentMonth.id}
          onSaveEntry={handleSaveEntry}
          onSaveQualitative={handleSaveQualitative}
        />
      );
    }

    // 14. Dashboard
    return <Dashboard state={state} />;
  };

  return (
    <Layout 
      currentStep={currentStep} 
      totalSteps={15} 
      title={`${state.department ? state.department + ' | ' : ''}${state.projectName}`}
      stepTitle={stepTitle}
    >
      <div className="min-h-[60vh] flex flex-col">
        <div className="flex-1">
          {renderContent()}
        </div>

        {/* Wizard Footer Navigation (Only show if not Landing) */}
        {currentStep > 0 && (
          <div className="sticky bottom-0 mt-12 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 -mx-4 md:-mx-8 z-20">
             <div className="max-w-5xl mx-auto flex justify-between items-center">
               {/* BACK BUTTON */}
               {currentStep === 1 ? (
                 <button 
                  onClick={() => setCurrentStep(0)} 
                  className="px-6 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                 >
                   Anulează
                 </button>
               ) : (
                 <button 
                  onClick={prevStep} 
                  className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 border border-slate-200 bg-white"
                 >
                   <ChevronLeft className="w-4 h-4" /> Înapoi
                 </button>
               )}

               {/* NEXT BUTTON */}
               {currentStep < 14 && (
                 <button 
                   onClick={nextStep}
                   disabled={currentStep === 1 && state.kpis.length === 0}
                   className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {currentStep === 13 ? 'Finalizare & Raport' : 'Pasul Următor'} <ChevronRight className="w-5 h-5" />
                 </button>
               )}
               {/* On Dashboard, button is handled inside component or hidden */}
               {currentStep === 14 && (
                  <button 
                  onClick={() => setCurrentStep(0)} 
                  className="px-6 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                 >
                   Începe din nou
                 </button>
               )}
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
