import React from 'react';
import { LayoutDashboard, CheckCircle2 } from 'lucide-react';

interface ProgressInfo {
  current: number;
  total: number;
  label: string;
  subProgress?: number;
}

interface LayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  stepTitle?: string;
  stepDescription?: string;
  progressInfo?: ProgressInfo | null;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  title,
  stepTitle,
  stepDescription,
  progressInfo
}) => {
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-lg font-bold tracking-tight">
              Raport KPI
              {title && <span className="text-slate-400 font-normal"> | {title}</span>}
            </h1>
          </div>

          {/* Progress Steps */}
          {progressInfo && (
            <div className="hidden sm:flex items-center gap-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${step < progressInfo.current
                      ? 'bg-green-500 text-white'
                      : step === progressInfo.current
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-500'
                    }
                  `}>
                    {step < progressInfo.current ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div className={`w-8 h-1 rounded ${step < progressInfo.current ? 'bg-green-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32">
          {/* Step Header */}
          {stepTitle && (
            <div className="mb-8 pb-6 border-b border-slate-200">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{stepTitle}</h2>
              {stepDescription && (
                <p className="text-slate-500 text-lg leading-relaxed max-w-3xl">
                  {stepDescription}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};
