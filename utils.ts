import { KPI, TargetOperator } from './types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

export const checkIsOutOfTarget = (val: number | string, kpi: KPI): boolean => {
  if (kpi.type === 'text') {
    // For text, we assume it's always "on target" unless manually flagged, 
    // or we could add logic. For this app, we'll let the user decide 
    // "Action Required" via a UI toggle if it's text, 
    // OR if we strictly follow the prompt: "performance indicators can be % numbers out of an number, or subjective feedback."
    // Let's treat 'text' as requiring manual review. 
    // However, if the value is empty, it's not "out of target", just empty.
    return false; 
  }

  const numVal = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(numVal)) return false;

  const target = kpi.targetValue;

  switch (kpi.operator) {
    case '>': return numVal <= target; // Target is > 10, Value is 9 -> Out of target
    case '>=': return numVal < target;
    case '<': return numVal >= target; // Target is < 5, Value is 6 -> Out of target
    case '<=': return numVal > target;
    default: return false;
  }
};

export const formatValue = (val: number | string, type: 'number' | 'percentage' | 'text') => {
  if (type === 'text') return val;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '-';
  
  if (type === 'percentage') {
    return `${num}%`;
  }
  return num.toLocaleString('ro-RO');
};

export const getOperatorLabel = (op: TargetOperator) => {
  switch (op) {
    case '>': return 'Mai mare ca';
    case '<': return 'Mai mic ca';
    case '>=': return 'Cel puțin';
    case '<=': return 'Cel mult';
    case 'exists': return 'Există';
    default: return op;
  }
};