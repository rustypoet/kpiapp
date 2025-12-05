
import * as XLSX from 'xlsx';
import { AppState, KPI, MonthlyData, KpiEntry, MonthlyQualitative } from '../types';

// Define sheet names
const SHEET_INFO = 'Info';
const SHEET_KPIS = 'Configurare';
const SHEET_DATA = 'Date Performanta';
const SHEET_QUALITATIVE = 'Analiza Calitativa';

export const exportToExcel = (state: AppState) => {
  const wb = XLSX.utils.book_new();

  // 1. Info Sheet (Metadata)
  const infoRows = [
    { Proprietate: 'Nume Proiect', Valoare: state.projectName },
    { Proprietate: 'Nume Manager', Valoare: state.managerName },
    { Proprietate: 'Departament', Valoare: state.department },
    { Proprietate: 'Data Export', Valoare: new Date().toISOString() }
  ];
  const wsInfo = XLSX.utils.json_to_sheet(infoRows);
  XLSX.utils.book_append_sheet(wb, wsInfo, SHEET_INFO);

  // 2. KPI Configuration Sheet
  const kpiRows = state.kpis.map(kpi => ({
    ID: kpi.id,
    Nume: kpi.name,
    Tip: kpi.type,
    Operator: kpi.operator,
    Tinta: kpi.targetValue,
    Unitate: kpi.unit || '',
    Descriere: kpi.description || ''
  }));
  const wsKpis = XLSX.utils.json_to_sheet(kpiRows);
  XLSX.utils.book_append_sheet(wb, wsKpis, SHEET_KPIS);

  // 3. Data Sheet (Flattened for easy pivot in Excel if needed)
  const dataRows: any[] = [];
  
  // Sort months
  const sortedMonths = Object.keys(state.data).sort();
  
  sortedMonths.forEach(monthStr => {
    const monthData = state.data[monthStr];
    state.kpis.forEach(kpi => {
      const entry = monthData.entries[kpi.id];
      if (entry) {
        dataRows.push({
          Luna: monthStr,
          KPI_ID: kpi.id,
          KPI_Nume: kpi.name,
          Valoare: entry.value,
          Status: entry.isOutOfTarget ? 'Ratat' : 'Atins',
          Actiune_Necesara: entry.actionTask || '',
          Responsabil: entry.responsible || '',
          Termen_Limita: entry.dueDate || '',
          Status_Actiune: entry.status || '',
          Nota: entry.note || ''
        });
      }
    });
  });

  const wsData = XLSX.utils.json_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(wb, wsData, SHEET_DATA);

  // 4. Qualitative Sheet (New)
  const qualRows: any[] = [];
  sortedMonths.forEach(monthStr => {
    const monthData = state.data[monthStr];
    if (monthData.qualitative) {
      qualRows.push({
        Luna: monthStr,
        Status_Activitati: monthData.qualitative.activityStatus || '',
        Tendinte: monthData.qualitative.trends || '',
        Riscuri: monthData.qualitative.risks || '',
        Nevoi_High: monthData.qualitative.needsHigh || '',
        Nevoi_Medium: monthData.qualitative.needsMedium || '',
        Nevoi_Low: monthData.qualitative.needsLow || '',
        Propuneri: monthData.qualitative.improvements || ''
      });
    }
  });

  if (qualRows.length > 0) {
    const wsQual = XLSX.utils.json_to_sheet(qualRows);
    XLSX.utils.book_append_sheet(wb, wsQual, SHEET_QUALITATIVE);
  }

  // Write file
  const filename = `${state.department || 'Dept'}_${state.managerName || 'Manager'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename.replace(/\s+/g, '_'));
};

export const importFromExcel = (file: File): Promise<AppState> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });

        // 1. Parse Info (Optional, for backward compatibility)
        let managerName = '';
        let department = '';
        let projectName = file.name.replace('.xlsx', '');

        const wsInfo = wb.Sheets[SHEET_INFO];
        if (wsInfo) {
          const infoRaw = XLSX.utils.sheet_to_json(wsInfo) as any[];
          infoRaw.forEach(row => {
            // Check English and Romanian headers for compatibility
            if (row.Proprietate === 'Nume Manager' || row.Property === 'Manager Name') managerName = row.Valoare || row.Value;
            if (row.Proprietate === 'Departament' || row.Property === 'Department') department = row.Valoare || row.Value;
            if (row.Proprietate === 'Nume Proiect' || row.Property === 'Project Name') projectName = row.Valoare || row.Value;
          });
        }

        // 2. Parse KPIs
        // Try Romanian name first, fallback to English
        const kpiSheetName = wb.SheetNames.find(n => n === 'Configurare' || n === 'Configuration');
        if (!kpiSheetName) throw new Error("Fișier Excel invalid: Lipsește foaia 'Configurare'.");
        
        const wsKpis = wb.Sheets[kpiSheetName];
        
        const kpiRaw = XLSX.utils.sheet_to_json(wsKpis) as any[];
        const kpis: KPI[] = kpiRaw.map((row: any) => ({
          id: row.ID?.toString() || Math.random().toString(36),
          name: row.Nume || row.Name,
          type: row.Tip || row.Type,
          operator: row.Operator,
          targetValue: row.Tinta !== undefined ? row.Tinta : row.Target,
          unit: row.Unitate || row.Unit,
          description: row.Descriere || row.Description
        }));

        // 3. Parse Data
        const dataSheetName = wb.SheetNames.find(n => n === 'Date Performanta' || n === 'Performance Data');
        const loadedData: Record<string, MonthlyData> = {};

        if (dataSheetName) {
          const wsData = wb.Sheets[dataSheetName];
          const dataRaw = XLSX.utils.sheet_to_json(wsData) as any[];
          dataRaw.forEach((row: any) => {
            const month = row.Luna || row.Month;
            const kpiId = row.KPI_ID?.toString();
            
            if (!month || !kpiId) return;

            if (!loadedData[month]) {
              loadedData[month] = { monthStr: month, entries: {} };
            }

            const isMissed = (row.Status === 'Ratat' || row.Status === 'Missed');

            const entry: KpiEntry = {
              kpiId,
              value: row.Valoare !== undefined ? row.Valoare : row.Value,
              isOutOfTarget: isMissed,
              actionTask: row.Actiune_Necesara || row.Action_Task,
              responsible: row.Responsabil || row.Responsible,
              dueDate: row.Termen_Limita || row.Due_Date,
              status: (row.Status_Actiune || row.Task_Status) as any,
              note: row.Nota || row.Note
            };
            
            loadedData[month].entries[kpiId] = entry;
          });
        }

        // 4. Parse Qualitative (New)
        const qualSheetName = wb.SheetNames.find(n => n === SHEET_QUALITATIVE);
        if (qualSheetName) {
          const wsQual = wb.Sheets[qualSheetName];
          const qualRaw = XLSX.utils.sheet_to_json(wsQual) as any[];
          qualRaw.forEach((row: any) => {
            const month = row.Luna;
            if (month && loadedData[month]) {
              loadedData[month].qualitative = {
                activityStatus: row.Status_Activitati,
                trends: row.Tendinte,
                risks: row.Riscuri,
                needsHigh: row.Nevoi_High,
                needsMedium: row.Nevoi_Medium,
                needsLow: row.Nevoi_Low,
                improvements: row.Propuneri
              };
            }
          });
        }

        resolve({
          managerName,
          department,
          projectName,
          kpis,
          data: loadedData
        });

      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
