interface CalculationInput {
  hourlyRate: number;
  profitMargin: number;
  materialCost: number;
  fixedCosts: number;
  taxRate: number;
}

interface PositionData {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  hours?: number;
  hourlyRate?: number;
}

interface CalculatedPosition extends PositionData {
  totalNet: number;
  order: number;
}

export function calculatePositionPrice(
  position: PositionData,
  companyData: CalculationInput
): number {
  if (position.unitPrice) {
    return position.quantity * position.unitPrice;
  }

  if (position.hours && position.hourlyRate) {
    return position.hours * position.hourlyRate;
  }

  if (position.hours) {
    return position.hours * companyData.hourlyRate;
  }

  return 0;
}

export function calculateOfferTotals(
  positions: CalculatedPosition[],
  taxRate: number
) {
  const subtotalNet = positions.reduce((sum, pos) => sum + pos.totalNet, 0);
  const taxAmount = subtotalNet * taxRate;
  const totalGross = subtotalNet + taxAmount;

  return {
    subtotalNet: Math.round(subtotalNet * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function calculateDays(startDate: Date): number {
  const today = new Date();
  const diff = startDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
