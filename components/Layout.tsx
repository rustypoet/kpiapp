import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  stepTitle?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentStep, totalSteps, title, stepTitle }) => {
  // Steps: 0=Landing, 1=Config, 2..13=Months, 14=Dashboard
  const progress = Math.min(100, (currentStep / (totalSteps - 1)) * 100);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-lg font-bold tracking-tight">Centralizator KPI <span className="text-slate-400 font-normal">| {title}</span></h1>
          </div>
          
          {currentStep > 0 && currentStep < totalSteps && (
            <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <span className="hidden sm:inline">Pasul {currentStep} din {totalSteps - 1}</span>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
          {stepTitle && (
            <div className="mb-6 pb-4 border-b border-slate-200">
              <h2 className="text-3xl font-bold text-slate-800">{stepTitle}</h2>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};