
import { PlanSection, LineItemType, ForecastGrowthRates, SectionType, PlanLineItem } from '../types';

export const sumLineItem = (values: { [month: number]: number }): number => {
  return Object.values(values).reduce((acc, val) => acc + val, 0);
};

export const calculateSectionTotal = (section: PlanSection, month?: number): number => {
  if (!section || !section.items) return 0;
  return section.items.reduce((acc, item) => {
    const val = month !== undefined ? (item.values[month] || 0) : sumLineItem(item.values);
    return acc + val;
  }, 0);
};

export const calculateKeyFigures = (sections: PlanSection[], month?: number) => {
  const getSectionTotal = (type: SectionType) => {
    const section = sections.find(s => s.type === type);
    return section ? calculateSectionTotal(section, month) : 0;
  };

  const revenue = getSectionTotal('REVENUE');
  const material = getSectionTotal('MATERIAL');
  const db1 = revenue - material;

  const personnel = getSectionTotal('PERSONNEL');
  const db2 = db1 - personnel;

  const depr = getSectionTotal('DEPRECIATION');
  const operating = getSectionTotal('OPERATING');
  const admin = getSectionTotal('ADMIN');
  const sales = getSectionTotal('SALES');
  const finance = getSectionTotal('FINANCE');

  // Operatives Ergebnis (EBIT)
  const ebit = db2 - (depr + operating + admin + sales);
  
  // EBITDA
  const ebitda = ebit + depr;
  
  // EGT (Ergebnis der gewöhnlichen Geschäftstätigkeit)
  const egt = ebit - finance;

  // Steuern & Privat
  const taxSection = sections.find(s => s.type === 'TAX_PROVISION');
  let privateWithdrawals = 0;
  let svs = 0;
  let incomeTax = 0;
  
  if (taxSection) {
    taxSection.items.forEach(item => {
      const val = month !== undefined ? (item.values[month] || 0) : sumLineItem(item.values);
      const label = item.label.toLowerCase();
      if (item.accountNumber === '7780' || label.includes('svs')) svs += val;
      else if (label.includes('einkommensteuer') || label.includes('est')) incomeTax += val;
      else if (label.includes('privat') || label.includes('unternehmerlohn')) privateWithdrawals += val;
    });
  }

  const result = egt - svs - incomeTax - privateWithdrawals;
  const totalFixedCosts = depr + operating + admin + sales + finance;

  return {
    revenue, material, db1, personnel, db2, depr, operating, admin, sales, finance,
    ebit, ebitda, egt, privateWithdrawals, svs, incomeTax, result, totalFixedCosts
  };
};

export const distributeYearly = (total: number): { [month: number]: number } => {
  const monthly = Math.round((total / 12) * 100) / 100;
  const values: { [month: number]: number } = {};
  let distributed = 0;
  for (let i = 1; i <= 11; i++) {
    values[i] = monthly;
    distributed += monthly;
  }
  values[12] = Math.round((total - distributed) * 100) / 100;
  return values;
};

export const projectForecast = (sections: PlanSection[], rates: ForecastGrowthRates, years: number = 5) => {
  const baseFigures = calculateKeyFigures(sections);
  const projections = [];

  for (let i = 0; i <= years; i++) {
    const factor = (rate: number) => Math.pow(1 + rate / 100, i);
    const projectedRevenue = baseFigures.revenue * factor(rates.REVENUE);
    const projectedMaterial = baseFigures.material * factor(rates.MATERIAL);
    const projectedPersonnel = baseFigures.personnel * factor(rates.PERSONNEL);
    const projectedOperating = baseFigures.operating * factor(rates.OPERATING);
    const projectedAdmin = baseFigures.admin * factor(rates.OPERATING); 
    const projectedSales = baseFigures.sales * factor(rates.OPERATING); 
    const projectedFinance = baseFigures.finance * factor(rates.FINANCE);
    const projectedDepr = baseFigures.depr;

    const db1 = projectedRevenue - projectedMaterial;
    const db2 = db1 - projectedPersonnel;
    const ebit = db2 - (projectedDepr + projectedOperating + projectedAdmin + projectedSales);
    const ebitda = ebit + projectedDepr;
    const egt = ebit - projectedFinance;
    const projectedSvs = baseFigures.svs * factor(rates.TAX);
    const projectedIncomeTax = baseFigures.incomeTax * factor(rates.TAX);
    const projectedPrivate = baseFigures.privateWithdrawals;
    const result = egt - projectedSvs - projectedIncomeTax - projectedPrivate;

    projections.push({
      yearOffset: i,
      revenue: projectedRevenue,
      db1, ebitda, egt, result
    });
  }
  return projections;
};
