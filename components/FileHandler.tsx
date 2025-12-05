import React, { useRef } from 'react';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { AppState } from '../types';
import { exportToExcel, importFromExcel } from '../services/excelService';

interface Props {
  state: AppState;
  onImport: (newState: AppState) => void;
}

export const FileHandler: React.FC<Props> = ({ state, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportToExcel(state);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const newState = await importFromExcel(file);
        onImport(newState);
        alert('Date importate cu succes!');
      } catch (err) {
        console.error(err);
        alert('Eșec la import. Asigurați-vă că fișierul are formatul corect.');
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <FileSpreadsheet className="w-16 h-16 text-blue-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Management Date</h2>
        <p className="text-slate-500 mt-2">
          Această aplicație nu stochează date pe server.
          <br />
          Trebuie să folosiți <strong>Export</strong> pentru a salva și <strong>Import</strong> pentru a continua.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={handleExport}
          className="flex flex-col items-center justify-center p-8 bg-white border-2 border-blue-100 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Download className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold text-slate-800">Salvează Excel</span>
          <span className="text-sm text-slate-400 mt-2 text-center">Descarcă situația curentă</span>
        </button>

        <button
          onClick={handleImportClick}
          className="flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-100 rounded-xl shadow-sm hover:border-slate-400 hover:shadow-md transition-all group"
        >
           <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-800 group-hover:text-white transition-colors">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold text-slate-800">Încarcă din Excel</span>
          <span className="text-sm text-slate-400 mt-2 text-center">Restaurează sesiunea anterioară</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx" 
            className="hidden" 
          />
        </button>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <strong>Notă:</strong> Păstrați întotdeauna o copie a fișierelor Excel. Modificările sunt locale până la export.
      </div>
    </div>
  );
};