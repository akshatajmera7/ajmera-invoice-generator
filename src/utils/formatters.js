export function formatCurrency(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateToIndian(dateString) {
  if (!dateString) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  // If format is YYYY-MM-DD
  if (typeof dateString === 'string' && dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateString;
}

export function getTodayDateInput() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isOutOfRajasthan(invoiceData) {
  if (!invoiceData) return false;
  if (invoiceData.taxType === 'inter_state') return true;
  if (invoiceData.taxType === 'intra_state') return false;
  const pos = (invoiceData.placeOfSupply || '').trim().toLowerCase();
  const st = (invoiceData.customer?.state || '').trim().toLowerCase();
  if (pos && pos !== 'rajasthan') return true;
  if (st && st !== 'rajasthan') return true;
  return false;
}

export const INDIAN_STATES = [
  'Rajasthan',
  'Gujarat',
  'Delhi',
  'Maharashtra',
  'Madhya Pradesh',
  'Uttar Pradesh',
  'Haryana',
  'Punjab',
  'Karnataka',
  'Tamil Nadu',
  'Telangana',
  'Andhra Pradesh',
  'West Bengal',
  'Bihar',
  'Odisha',
  'Kerala',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
  'Goa',
  'Jammu and Kashmir',
  'Chandigarh',
];

