export const today = () => new Date().toISOString().slice(0, 10);
export const fmt   = (n) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct   = (n) => (Number(n || 0) * 100).toFixed(1) + "%";
export const daysSince = (dateStr) => Math.floor((new Date() - new Date(dateStr)) / 86400000);
export const saleBalance = (sale) => sale.price - (sale.payments || []).reduce((s, p) => s + p.amount, 0);
export const isOverdue   = (sale, days) => saleBalance(sale) > 0 && daysSince(sale.date) > days;

export function getDateBounds(preset, customFrom, customTo) {
  const now = new Date(); const y = now.getFullYear(), m = now.getMonth();
  if (preset === "thisMonth") return { from: `${y}-${String(m+1).padStart(2,"0")}-01`, to: today() };
  if (preset === "lastMonth") {
    const lm = m === 0 ? 11 : m - 1, ly = m === 0 ? y - 1 : y;
    const lastDay = String(new Date(ly, lm + 1, 0).getDate()).padStart(2, "0");
    const mm = String(lm + 1).padStart(2, "0");
    return { from: `${ly}-${mm}-01`, to: `${ly}-${mm}-${lastDay}` };
  }
  if (preset === "custom") return { from: customFrom || "", to: customTo || today() };
  return { from: null, to: null };
}

export function filterByDate(items, bounds) {
  if (!bounds.from) return items;
  return items.filter(i => i.date >= bounds.from && i.date <= (bounds.to || today()));
}

export function exportCSV(rows, cols, filename) {
  const escape = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.map(c => escape(c.label)).join(","), ...rows.map(r => cols.map(c => escape(c.get(r))).join(","))].join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
}

export function buildDeposits(sales) {
  const byDate = {};
  (sales || []).forEach(sale => (sale.payments || []).forEach(p => {
    if (!byDate[p.date]) byDate[p.date] = { visamc: 0, amex: 0, cash: 0, finance: 0, check: 0, cod: 0 };
    const key = { "Visa/MC": "visamc", AMEX: "amex", Cash: "cash", Finance: "finance", Check: "check", COD: "cod" }[p.method] || "cash";
    byDate[p.date][key] += p.amount;
  }));
  return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, vals]) => ({ date, ...vals }));
}

export function buildMonthlyPL(sales, expenses) {
  const months = {};
  (sales || []).forEach(s => {
    const m = s.date.slice(0, 7);
    if (!months[m]) months[m] = { revenue: 0, cost: 0, collected: 0, expenses: 0 };
    months[m].revenue   += s.price;
    months[m].cost      += s.cost;
    months[m].collected += (s.payments || []).reduce((sum, p) => sum + p.amount, 0);
  });
  (expenses || []).forEach(e => {
    const m = e.date.slice(0, 7);
    if (!months[m]) months[m] = { revenue: 0, cost: 0, collected: 0, expenses: 0 };
    months[m].expenses += e.amount;
  });
  return Object.entries(months).sort(([a], [b]) => b.localeCompare(a)).map(([month, d]) => ({
    month,
    revenue: d.revenue, cost: d.cost,
    profit: d.revenue - d.cost,
    margin: d.revenue > 0 ? (d.revenue - d.cost) / d.revenue : 0,
    collected: d.collected, expenses: d.expenses,
    cashFlow: d.collected - d.expenses,
  }));
}

export const PAYMENT_TYPES = ["Visa/MC", "AMEX", "Cash", "Finance", "Check", "COD"];

export const EXPENSE_CATS = [
  { id: "vendors",     label: "Vendors / Inventory",  color: "#E8853D" },
  { id: "utilities",   label: "Utilities",             color: "#5B8DEF" },
  { id: "ccfees",      label: "Credit Card Fees",      color: "#D45B5B" },
  { id: "advertising", label: "Advertising",           color: "#8B5CF6" },
  { id: "accounting",  label: "Accounting / Payroll",  color: "#2DD4A8" },
  { id: "employees",   label: "Employee Pay",          color: "#F59E0B" },
  { id: "misc",        label: "Miscellaneous",         color: "#94A3B8" },
];

export const SALE_CSV_COLS = [
  { label: "Date",          get: r => r.date },
  { label: "Customer",      get: r => r.customer },
  { label: "Phone",         get: r => r.phone },
  { label: "Salesperson",   get: r => r.salesperson },
  { label: "Items",         get: r => r.itemsSummary || r.items },
  { label: "Address",       get: r => r.address },
  { label: "Price",         get: r => r.price },
  { label: "Cost",          get: r => r.cost },
  { label: "Margin %",      get: r => r.price > 0 ? ((r.price - r.cost) / r.price * 100).toFixed(1) : "0" },
  { label: "Paid",          get: r => (r.payments || []).reduce((s, p) => s + p.amount, 0) },
  { label: "Balance",       get: r => saleBalance(r) },
  { label: "Delivery Date", get: r => r.deliveryDate },
  { label: "Delivered",     get: r => r.delivered ? "Yes" : "No" },
  { label: "Notes",         get: r => r.notes },
  { label: "Status",        get: r => r.cancelledAt ? "Cancelled" : "Active" },
];

export const EXPENSE_CSV_COLS = [
  { label: "Date",     get: r => r.date },
  { label: "Category", get: r => r.category },
  { label: "Vendor",   get: r => r.vendor },
  { label: "Amount",   get: r => r.amount },
  { label: "Note",     get: r => r.note },
];
