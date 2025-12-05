
import React, { useState, useMemo, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { KpiConfig } from './components/KpiConfig';
import { QADashboard } from './components/QADashboard';
import { AppState, KPI, KpiEntry, MonthlyQualitative } from './types';
import { importFromExcel } from './services/excelService';
import { ChevronRight, ChevronLeft, Upload, FileSpreadsheet, PlayCircle, User, Building2, BarChart3, HelpCircle, CheckCircle2, ClipboardCheck } from 'lucide-react';

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
    projectName: 'Raport Performanta Departament'
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
        alert('Nu am putut citi fisierul. Verificati ca este un fisier Excel valid exportat din aceasta aplicatie.');
      }
    }
  };

  // Navigation
  const nextStep = () => setCurrentStep(p => Math.min(p + 1, 14));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 0));

  // Determine Title and Description based on Step
  let stepTitle = "";
  let stepDescription = "";

  if (currentStep === 1) {
    stepTitle = "Pasul 1 din 3: Definiti Indicatorii";
    stepDescription = "Adaugati indicatorii de performanta (KPI) pe care doriti sa ii urmariti lunar pentru departamentul dumneavoastra.";
  } else if (currentStep >= 2 && currentStep <= 13) {
    const monthIndex = currentStep - 2;
    stepTitle = `Pasul 2 din 3: Completati Datele pentru ${months[monthIndex].name}`;
    stepDescription = "Introduceti valorile realizate pentru fiecare indicator. Daca un indicator nu atinge tinta, completati planul de actiune.";
  } else if (currentStep === 14) {
    stepTitle = "Pasul 3 din 3: Verificati si Salvati";
    stepDescription = "Verificati datele introduse si salvati raportul final.";
  }

  // RENDER QA MODE
  if (mode === 'qa') {
    return <QADashboard onBack={() => setMode('manager')} />;
  }

  // RENDER CONTENT
  const renderContent = () => {
    // 0. Landing
    if (currentStep === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-in zoom-in duration-500">

          {/* Welcome Header */}
          <div className="text-center space-y-4 max-w-3xl px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-200">
              <ClipboardCheck className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
              Bine ati venit!
            </h1>
            <p className="text-slate-600 text-xl leading-relaxed">
              Aceasta aplicatie va ajuta sa completati <strong>raportul lunar de performanta</strong> al departamentului dumneavoastra in doar <strong>3 pasi simpli</strong>.
            </p>
          </div>

          {/* Steps Overview */}
          <div className="w-full max-w-4xl px-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Cum functioneaza?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-blue-900">Definiti Indicatorii</p>
                    <p className="text-sm text-blue-700">Adaugati KPI-urile pe care le urmariti (ex: vanzari, productivitate)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-blue-900">Completati Datele</p>
                    <p className="text-sm text-blue-700">Pentru fiecare luna, introduceti valorile realizate</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-blue-900">Salvati Raportul</p>
                    <p className="text-sm text-blue-700">Verificati si salvati - datele vor fi trimise automat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="w-full max-w-4xl px-4">
            <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-lg">
              <div className="border-b border-slate-100 pb-6 mb-6">
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <User className="w-7 h-7 text-blue-600" />
                  Introduceti Datele Dumneavoastra
                </h3>
                <p className="text-slate-500 mt-2">
                  Aceste informatii vor aparea in raportul final si vor ajuta la identificarea departamentului.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-2">
                    Numele si Prenumele Dumneavoastra <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 text-lg bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    placeholder="Exemplu: Popescu Ion"
                    value={state.managerName}
                    onChange={e => handleIdentityChange('managerName', e.target.value)}
                  />
                  <p className="text-sm text-slate-400 mt-1">Scrieti numele complet asa cum doriti sa apara in raport</p>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-slate-700 mb-2">
                    Departamentul <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 text-lg bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    placeholder="Exemplu: Vanzari, Productie, Logistica, Resurse Umane..."
                    value={state.department}
                    onChange={e => handleIdentityChange('department', e.target.value)}
                  />
                  <p className="text-sm text-slate-400 mt-1">Numele departamentului pe care il conduceti</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={startNew}
                  disabled={!state.managerName || !state.department}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-blue-200 disabled:shadow-none"
                >
                  <PlayCircle className="w-6 h-6" />
                  Incepe Raportul Nou
                </button>

                <div className="relative sm:w-auto">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 text-lg font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all"
                  >
                    <Upload className="w-6 h-6" />
                    Am deja un raport salvat
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".xlsx" className="hidden" />
                </div>
              </div>
            </div>
          </div>

          {/* QA Access - Less prominent */}
          <div className="w-full max-w-4xl px-4">
            <div className="bg-slate-800 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-white">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="font-semibold">Sunteti din echipa de QA sau Management?</p>
                  <p className="text-sm text-slate-400">Accesati panoul de analiza pentru a vedea toate rapoartele</p>
                </div>
              </div>
              <button
                onClick={startQA}
                className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap"
              >
                Deschide Panoul QA <ChevronRight className="w-5 h-5" />
              </button>
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

  // Calculate progress for navigation
  const getProgressInfo = () => {
    if (currentStep === 0) return null;
    if (currentStep === 1) return { current: 1, total: 3, label: 'Definire Indicatori' };
    if (currentStep >= 2 && currentStep <= 13) {
      const monthsDone = currentStep - 1;
      return {
        current: 2,
        total: 3,
        label: `Completare Date (Luna ${monthsDone}/12)`,
        subProgress: ((currentStep - 1) / 12) * 100
      };
    }
    return { current: 3, total: 3, label: 'Verificare si Salvare' };
  };

  const progressInfo = getProgressInfo();

  return (
    <Layout
      currentStep={currentStep}
      totalSteps={15}
      title={state.department || 'Raport Performanta'}
      stepTitle={stepTitle}
      stepDescription={stepDescription}
      progressInfo={progressInfo}
    >
      <div className="min-h-[60vh] flex flex-col">
        <div className="flex-1">
          {renderContent()}
        </div>

        {/* Wizard Footer Navigation (Only show if not Landing) */}
        {currentStep > 0 && (
          <div className="sticky bottom-0 mt-12 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 p-4 -mx-4 md:-mx-8 z-20 shadow-lg">
            <div className="max-w-5xl mx-auto">

              {/* Progress indicator for month steps */}
              {currentStep >= 2 && currentStep <= 13 && (
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>Luna {currentStep - 1} din 12</span>
                    <span>{Math.round(((currentStep - 1) / 12) * 100)}% completat</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${((currentStep - 1) / 12) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center gap-4">
                {/* BACK BUTTON */}
                {currentStep === 1 ? (
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 border border-slate-200"
                  >
                    <ChevronLeft className="w-5 h-5" /> Inapoi la Inceput
                  </button>
                ) : currentStep === 14 ? (
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 border border-slate-200"
                  >
                    Incepe un Raport Nou
                  </button>
                ) : (
                  <button
                    onClick={prevStep}
                    className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 border border-slate-200"
                  >
                    <ChevronLeft className="w-5 h-5" /> Luna Anterioara
                  </button>
                )}

                {/* NEXT BUTTON */}
                {currentStep < 14 && (
                  <button
                    onClick={nextStep}
                    disabled={currentStep === 1 && state.kpis.length === 0}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {currentStep === 1 && (
                      <>
                        Continua cu Completarea Datelor <ChevronRight className="w-6 h-6" />
                      </>
                    )}
                    {currentStep >= 2 && currentStep < 13 && (
                      <>
                        Salveaza si Treci la Luna Urmatoare <ChevronRight className="w-6 h-6" />
                      </>
                    )}
                    {currentStep === 13 && (
                      <>
                        <CheckCircle2 className="w-6 h-6" /> Finalizeaza si Vezi Raportul
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Help text */}
              {currentStep === 1 && state.kpis.length === 0 && (
                <p className="text-center text-amber-600 text-sm mt-3 font-medium">
                  Adaugati cel putin un indicator (KPI) pentru a putea continua
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
