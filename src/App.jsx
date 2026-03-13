import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || "stortrack2026";
const AUTH_KEY = "stortrack_auth";

function useAuth() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const login = (pw) => { if (pw === APP_PASSWORD) { sessionStorage.setItem(AUTH_KEY, "1"); setAuthed(true); return true; } return false; };
  const logout = () => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); };
  return { authed, login, logout };
}

function LockScreen({ onLogin }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(false);
  const submit = (e) => { e.preventDefault(); if (!onLogin(pw)) { setErr(true); setPw(""); setTimeout(() => setErr(false), 1500); } };
  return (
    <div style={{ minHeight: "100vh", background: "#0F1118", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={{ background: "#181B25", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #5B8DEF, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 auto 20px" }}>S</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E9ED", marginBottom: 4 }}>StorTrack</div>
        <div style={{ fontSize: 12, color: "#6B7084", marginBottom: 28 }}>Enter your password to continue</div>
        <form onSubmit={submit}>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus
            style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${err ? "#D45B5B" : "#252836"}`, background: "#0F1118", color: "#E8E9ED", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
          {err && <div style={{ color: "#D45B5B", fontSize: 12, marginBottom: 10 }}>Incorrect password</div>}
          <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#5B8DEF", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Unlock</button>
        </form>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return w;
}

const PAYMENT_TYPES = ["Visa/MC", "AMEX", "Cash", "Finance", "Check", "COD"];
const EXPENSE_CATS = [
  { id: "vendors",    label: "Vendors / Inventory",  color: "#E8853D" },
  { id: "utilities",  label: "Utilities",             color: "#5B8DEF" },
  { id: "ccfees",     label: "Credit Card Fees",      color: "#D45B5B" },
  { id: "advertising",label: "Advertising",           color: "#8B5CF6" },
  { id: "accounting", label: "Accounting / Payroll",  color: "#2DD4A8" },
  { id: "employees",  label: "Employee Pay",          color: "#F59E0B" },
  { id: "misc",       label: "Miscellaneous",         color: "#94A3B8" },
];

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => (Number(n || 0) * 100).toFixed(1) + "%";

// ─── Date Range ───────────────────────────────────────────────────────────────
function getDateBounds(preset, customFrom, customTo) {
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

function filterByDate(items, bounds) {
  if (!bounds.from) return items;
  return items.filter(i => i.date >= bounds.from && i.date <= (bounds.to || today()));
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(rows, cols, filename) {
  const escape = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = cols.map(c => escape(c.label)).join(",");
  const body = rows.map(r => cols.map(c => escape(c.get(r))).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const SALE_CSV_COLS = [
  { label: "Date",          get: r => r.date },
  { label: "Customer",      get: r => r.customer },
  { label: "Phone",         get: r => r.phone },
  { label: "Salesperson",   get: r => r.salesperson },
  { label: "Items",         get: r => r.items },
  { label: "Address",       get: r => r.address },
  { label: "Price",         get: r => r.price },
  { label: "Cost",          get: r => r.cost },
  { label: "Margin %",      get: r => r.price > 0 ? ((r.price - r.cost) / r.price * 100).toFixed(1) : "0" },
  { label: "Paid",          get: r => r.payments.reduce((s, p) => s + p.amount, 0) },
  { label: "Balance",       get: r => r.price - r.payments.reduce((s, p) => s + p.amount, 0) },
  { label: "Delivery Date", get: r => r.deliveryDate },
  { label: "Delivery Time", get: r => r.deliveryTime },
  { label: "Delivered",     get: r => r.delivered ? "Yes" : "No" },
  { label: "Notes",         get: r => r.notes },
];

const EXPENSE_CSV_COLS = [
  { label: "Date",     get: r => r.date },
  { label: "Category", get: r => r.category },
  { label: "Vendor",   get: r => r.vendor },
  { label: "Amount",   get: r => r.amount },
  { label: "Note",     get: r => r.note },
];

// ─── Supabase Data ────────────────────────────────────────────────────────────
function useData() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [{ data: saleRows, error: se }, { data: payRows, error: pe }, { data: expRows, error: ee }, { data: spRows, error: spe }] = await Promise.all([
        supabase.from("sales").select("*").order("date", { ascending: false }),
        supabase.from("payments").select("*").order("date", { ascending: true }),
        supabase.from("expenses").select("*").order("date", { ascending: false }),
        supabase.from("salespeople").select("*").order("name"),
      ]);
      if (se || pe || ee || spe) throw se || pe || ee || spe;
      const payMap = {};
      (payRows || []).forEach(p => { if (!payMap[p.sale_id]) payMap[p.sale_id] = []; payMap[p.sale_id].push({ id: p.id, date: p.date, amount: Number(p.amount), method: p.method, note: p.note }); });
      setSales((saleRows || []).map(s => ({ id: s.id, date: s.date, customer: s.customer, phone: s.phone || "", items: s.items || "", address: s.address || "", price: Number(s.price), cost: Number(s.cost || 0), salesperson: s.salesperson || "", deliveryDate: s.delivery_date || "", deliveryTime: s.delivery_time || "", delivered: s.delivered || false, notes: s.notes || "", payments: payMap[s.id] || [] })));
      setExpenses((expRows || []).map(e => ({ id: e.id, date: e.date, category: e.category, vendor: e.vendor, amount: Number(e.amount), note: e.note || "" })));
      setSalespeople((spRows || []).map(s => s.name));
    } catch (err) { setError(err.message || "Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addSale = async (saleData, initPayment) => {
    const { data, error } = await supabase.from("sales").insert([{
      date: saleData.date, customer: saleData.customer, phone: saleData.phone, items: saleData.items,
      address: saleData.address, price: Number(saleData.price), cost: Number(saleData.cost || 0),
      salesperson: saleData.salesperson, delivery_date: saleData.deliveryDate || null,
      delivery_time: saleData.deliveryTime || null, notes: saleData.notes || null, delivered: false,
    }]).select().single();
    if (error) throw error;
    if (initPayment && Number(initPayment.amount) > 0) {
      const { error: pe } = await supabase.from("payments").insert([{ sale_id: data.id, date: saleData.date, amount: Number(initPayment.amount), method: initPayment.method, note: initPayment.note || "Initial deposit" }]);
      if (pe) throw pe;
    }
    await loadAll();
  };

  const editSale = async (saleId, updates) => {
    const { error } = await supabase.from("sales").update({
      date: updates.date, customer: updates.customer, phone: updates.phone, items: updates.items,
      address: updates.address, price: Number(updates.price), cost: Number(updates.cost || 0),
      salesperson: updates.salesperson, delivery_date: updates.deliveryDate || null,
      delivery_time: updates.deliveryTime || null, notes: updates.notes || null,
    }).eq("id", saleId);
    if (error) throw error;
    await loadAll();
  };

  const recordPayment = async (saleId, payData) => {
    const { error } = await supabase.from("payments").insert([{ sale_id: saleId, date: payData.date, amount: Number(payData.amount), method: payData.method, note: payData.note || "" }]);
    if (error) throw error;
    await loadAll();
  };

  const toggleDelivered = async (saleId, current) => {
    const { error } = await supabase.from("sales").update({ delivered: !current }).eq("id", saleId);
    if (error) throw error;
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, delivered: !current } : s));
  };

  const deleteSale = async (saleId) => {
    const { error } = await supabase.from("sales").delete().eq("id", saleId);
    if (error) throw error;
    await loadAll();
  };

  const addExpense = async (expData) => {
    const { error } = await supabase.from("expenses").insert([{ date: expData.date, category: expData.category, vendor: expData.vendor, amount: Number(expData.amount), note: expData.note || "" }]);
    if (error) throw error;
    await loadAll();
  };

  const deleteExpense = async (expId) => {
    const { error } = await supabase.from("expenses").delete().eq("id", expId);
    if (error) throw error;
    setExpenses(prev => prev.filter(e => e.id !== expId));
  };

  const addSalesperson = async (name) => {
    const { error } = await supabase.from("salespeople").insert([{ name }]);
    if (error) throw error;
    setSalespeople(prev => [...prev, name].sort());
  };

  return { sales, expenses, salespeople, loading, error, addSale, editSale, recordPayment, toggleDelivered, deleteSale, addExpense, deleteExpense, addSalesperson, reload: loadAll };
}

// ─── UI Components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "var(--card)", borderRadius: 12, padding: "14px 16px", borderLeft: `4px solid ${accent || "var(--accent)"}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dim)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Bar({ value, max, color }) {
  return (
    <div style={{ width: "100%", height: 7, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  const isMobile = window.innerWidth < 640;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: isMobile ? "20px 16px" : "28px 32px", width: "100%", maxWidth: isMobile ? "100%" : wide ? 640 : 520, maxHeight: isMobile ? "92vh" : "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 16 : 22 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--dim)", padding: "4px 8px", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", options, placeholder, half, multiline }) {
  const base = { width: "100%", padding: "9px 13px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ marginBottom: 14, flex: half ? 1 : undefined }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: "pointer" }}>{options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}</select>
        : multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />}
    </div>
  );
}

function Btn({ children, onClick, v = "primary", s, disabled }) {
  const styles = { primary: { background: "var(--accent)", color: "#fff", border: "none" }, ghost: { background: "transparent", color: "var(--dim)", border: "1px solid var(--line)" }, danger: { background: "transparent", color: "#D45B5B", border: "1px solid #D45B5B33" } };
  return <button onClick={onClick} disabled={disabled} style={{ ...styles[v], padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: disabled ? 0.6 : 1, ...s }}>{children}</button>;
}

function TH({ children, right }) { return <th style={{ padding: "10px 14px", textAlign: right ? "right" : "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dim)" }}>{children}</th>; }
function TD({ children, right, mono, bold, color, style: sx }) { return <td style={{ padding: "10px 14px", textAlign: right ? "right" : "left", fontFamily: mono ? "var(--mono)" : "inherit", fontWeight: bold ? 700 : 400, color: color || "inherit", fontSize: 13, whiteSpace: "nowrap", ...sx }}>{children}</td>; }
function Badge({ text, color, bg }) { return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color }}>{text}</span>; }

const hoverRow = {
  onMouseEnter: e => e.currentTarget.style.background = "rgba(91,141,239,0.06)",
  onMouseLeave: e => e.currentTarget.style.background = "transparent",
};

function saleBalance(sale) { return sale.price - sale.payments.reduce((s, p) => s + p.amount, 0); }

function buildDeposits(sales) {
  const byDate = {};
  sales.forEach(sale => sale.payments.forEach(p => {
    if (!byDate[p.date]) byDate[p.date] = { visamc: 0, amex: 0, cash: 0, finance: 0, check: 0, cod: 0 };
    const key = { "Visa/MC": "visamc", AMEX: "amex", Cash: "cash", Finance: "finance", Check: "check", COD: "cod" }[p.method] || "cash";
    byDate[p.date][key] += p.amount;
  }));
  return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, vals]) => ({ date, ...vals }));
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--line)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Date Range Bar ───────────────────────────────────────────────────────────
function DateRangeBar({ range, setRange, mobile }) {
  const presets = [["all", "All Time"], ["thisMonth", "This Month"], ["lastMonth", "Last Month"], ["custom", "Custom"]];
  return (
    <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: mobile ? "8px 12px" : "8px 28px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Period:</span>
      <div style={{ display: "flex", gap: 3, background: "var(--bg)", borderRadius: 8, padding: 3 }}>
        {presets.map(([k, l]) => (
          <button key={k} onClick={() => setRange(r => ({ ...r, preset: k }))}
            style={{ padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: range.preset === k ? "var(--accent)" : "transparent", color: range.preset === k ? "#fff" : "var(--dim)" }}>
            {l}
          </button>
        ))}
      </div>
      {range.preset === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
            style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
          <span style={{ color: "var(--dim)", fontSize: 12 }}>→</span>
          <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
            style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
        </div>
      )}
      {range.preset !== "all" && (() => {
        const bounds = getDateBounds(range.preset, range.from, range.to);
        if (bounds.from) return <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)" }}>{bounds.from} → {bounds.to || today()}</span>;
      })()}
    </div>
  );
}

// ─── Sale Form (reused for Add + Edit) ───────────────────────────────────────
const blankSaleForm = (sp) => ({ date: today(), customer: "", phone: "", items: "", address: "", price: "", cost: "", salesperson: sp || "", deliveryDate: "", deliveryTime: "", notes: "", initPayment: "", initMethod: "Visa/MC", initNote: "Initial deposit" });

function SaleForm({ form, setForm, salespeople, showPayment }) {
  return (
    <>
      <div style={{ display: "flex", gap: 12 }}>
        <Field label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" half />
        <Field label="Customer *" value={form.customer} onChange={v => setForm(f => ({ ...f, customer: v }))} placeholder="Customer name" half />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="Phone number" half />
        <Field label="Salesperson" value={form.salesperson} onChange={v => setForm(f => ({ ...f, salesperson: v }))} options={salespeople.length ? salespeople : [""]} half />
      </div>
      <Field label="Items" value={form.items} onChange={v => setForm(f => ({ ...f, items: v }))} placeholder="Products sold" />
      <Field label="Delivery Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Full address" />
      <div style={{ display: "flex", gap: 12 }}>
        <Field label="Sale Price *" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" placeholder="0.00" half />
        <Field label="Cost" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} type="number" placeholder="0.00" half />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Field label="Delivery Date" value={form.deliveryDate} onChange={v => setForm(f => ({ ...f, deliveryDate: v }))} type="date" half />
        <Field label="Delivery Time" value={form.deliveryTime} onChange={v => setForm(f => ({ ...f, deliveryTime: v }))} placeholder="e.g. 2-5pm" half />
      </div>
      <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Internal notes about this sale…" multiline />
      {showPayment && (
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Initial Payment (optional)</div>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Amount" value={form.initPayment} onChange={v => setForm(f => ({ ...f, initPayment: v }))} type="number" placeholder="0.00" half />
            <Field label="Method" value={form.initMethod} onChange={v => setForm(f => ({ ...f, initMethod: v }))} options={PAYMENT_TYPES} half />
          </div>
          <Field label="Note" value={form.initNote} onChange={v => setForm(f => ({ ...f, initNote: v }))} placeholder="Payment note" />
        </div>
      )}
    </>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ sales, expenses, salespeople, mobile }) {
  const totalRevenue = sales.reduce((s, x) => s + x.price, 0);
  const totalCost = sales.reduce((s, x) => s + x.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  const totalCollected = sales.reduce((s, sale) => s + sale.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const totalOwed = totalRevenue - totalCollected;
  const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
  const cashFlow = totalCollected - totalExpenses;
  const owedSales = sales.filter(s => saleBalance(s) > 0).sort((a, b) => saleBalance(b) - saleBalance(a));

  const spData = salespeople.map(sp => {
    const ss = sales.filter(s => s.salesperson === sp);
    const rev = ss.reduce((s, x) => s + x.price, 0);
    const cost = ss.reduce((s, x) => s + x.cost, 0);
    return { name: sp, count: ss.length, revenue: rev, profit: rev - cost, margin: rev > 0 ? (rev - cost) / rev : 0 };
  }).sort((a, b) => b.revenue - a.revenue);
  const maxRev = Math.max(...spData.map(s => s.revenue), 1);

  const expByCat = EXPENSE_CATS.map(cat => ({ ...cat, total: expenses.filter(e => e.category === cat.id).reduce((s, x) => s + x.amount, 0) })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  const maxExp = Math.max(...expByCat.map(e => e.total), 1);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Revenue" value={fmt(totalRevenue)} sub={`${sales.length} sales`} accent="#2DD4A8" />
        <StatCard label="Collected" value={fmt(totalCollected)} sub="Payments received" accent="#5B8DEF" />
        <StatCard label="Outstanding" value={fmt(totalOwed)} sub={`${owedSales.length} customer${owedSales.length !== 1 ? "s" : ""} owe`} accent={totalOwed > 0 ? "#F59E0B" : "#2DD4A8"} />
        <StatCard label="Gross Profit" value={fmt(totalProfit)} sub={`Margin: ${pct(avgMargin)}`} accent="#8B5CF6" />
        <StatCard label="Cash Flow" value={fmt(cashFlow)} sub="Collected - Expenses" accent={cashFlow >= 0 ? "#2DD4A8" : "#D45B5B"} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "var(--card)", borderRadius: 12, padding: 22 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700 }}>Salesperson Performance</h3>
            {spData.length === 0
              ? <div style={{ color: "var(--dim)", fontSize: 13 }}>No sales data yet.</div>
              : spData.map((sp, i) => (
                <div key={sp.name} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", fontSize: 10, fontWeight: 700, background: i === 0 ? "var(--accent)" : "var(--line)", color: i === 0 ? "#fff" : "var(--dim)" }}>{i + 1}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{sp.name}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontFamily: "var(--mono)", fontSize: 13 }}>{fmt(sp.revenue)}</span>
                      <span style={{ color: "var(--dim)", fontSize: 11, marginLeft: 6 }}>{pct(sp.margin)}</span>
                    </div>
                  </div>
                  <Bar value={sp.revenue} max={maxRev} color={["#2DD4A8", "#5B8DEF", "#8B5CF6", "#F59E0B"][i % 4]} />
                  <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 3 }}>{sp.count} sale{sp.count !== 1 ? "s" : ""} · {fmt(sp.profit)} profit</div>
                </div>
              ))}
          </div>

          {owedSales.length > 0 && (
            <div style={{ background: "var(--card)", borderRadius: 12, padding: 22, borderLeft: "4px solid #F59E0B" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>⚠ Outstanding Balances</h3>
              {owedSales.map(sale => {
                const bal = saleBalance(sale);
                const paidPct = sale.price > 0 ? (sale.price - bal) / sale.price : 0;
                return (
                  <div key={sale.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 2 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{sale.customer}</span>
                        <span style={{ color: "var(--dim)", fontSize: 11, marginLeft: 8 }}>{sale.phone}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontFamily: "var(--mono)", color: "#F59E0B", fontSize: 14 }}>{fmt(bal)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}><Bar value={sale.price - bal} max={sale.price} color="#F59E0B" /></div>
                      <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>{pct(paidPct)} paid</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 3 }}>Total: {fmt(sale.price)} · Paid: {fmt(sale.price - bal)} · {sale.date}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: "var(--card)", borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Expense Breakdown</h3>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--dim)", marginBottom: 14 }}>Total: {fmt(totalExpenses)}</div>
          {expByCat.length === 0
            ? <div style={{ color: "var(--dim)", fontSize: 13 }}>No expenses recorded yet.</div>
            : expByCat.map(cat => (
              <div key={cat.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{cat.label}</span>
                  <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{fmt(cat.total)}</span>
                </div>
                <Bar value={cat.total} max={maxExp} color={cat.color} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sales Tab ────────────────────────────────────────────────────────────────
function SalesTab({ sales, addSale, editSale, recordPayment, toggleDelivered, deleteSale, salespeople, addSalesperson, mobile, bounds }) {
  const [addModal, setAddModal]       = useState(false);
  const [editModal, setEditModal]     = useState(null); // sale id
  const [payModal, setPayModal]       = useState(null);
  const [spModal, setSpModal]         = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [newSp, setNewSp]             = useState("");
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all");
  const [saving, setSaving]           = useState(false);
  const [addForm, setAddForm]         = useState(() => blankSaleForm(salespeople[0]));
  const [editForm, setEditForm]       = useState(null);
  const [payForm, setPayForm]         = useState({ date: today(), amount: "", method: "Visa/MC", note: "" });

  useEffect(() => { if (salespeople.length && !addForm.salesperson) setAddForm(f => ({ ...f, salesperson: salespeople[0] })); }, [salespeople]);

  const handleAddSale = async () => {
    if (!addForm.customer || !addForm.price) return;
    setSaving(true);
    try { await addSale(addForm, { amount: addForm.initPayment, method: addForm.initMethod, note: addForm.initNote }); setAddForm(blankSaleForm(salespeople[0])); setAddModal(false); }
    catch (e) { alert("Error saving sale: " + e.message); }
    setSaving(false);
  };

  const handleEditSale = async () => {
    if (!editForm || !editForm.customer || !editForm.price) return;
    setSaving(true);
    try { await editSale(editModal, editForm); setEditModal(null); setEditForm(null); }
    catch (e) { alert("Error updating sale: " + e.message); }
    setSaving(false);
  };

  const openEdit = (sale) => {
    setEditForm({ date: sale.date, customer: sale.customer, phone: sale.phone, items: sale.items, address: sale.address, price: String(sale.price), cost: String(sale.cost), salesperson: sale.salesperson, deliveryDate: sale.deliveryDate, deliveryTime: sale.deliveryTime, notes: sale.notes });
    setEditModal(sale.id);
    setDetailModal(null);
  };

  const handleRecordPayment = async () => {
    if (!payForm.amount || !payModal) return;
    setSaving(true);
    try { await recordPayment(payModal, payForm); setPayForm({ date: today(), amount: "", method: "Visa/MC", note: "" }); setPayModal(null); }
    catch (e) { alert("Error recording payment: " + e.message); }
    setSaving(false);
  };

  const handleAddSp = async () => {
    if (!newSp.trim() || salespeople.includes(newSp.trim())) return;
    try { await addSalesperson(newSp.trim()); setNewSp(""); setSpModal(false); }
    catch (e) { alert("Error: " + e.message); }
  };

  const filtered = useMemo(() => {
    let list = filterByDate([...sales], bounds);
    if (filter === "owed") list = list.filter(s => saleBalance(s) > 0);
    if (filter === "paid") list = list.filter(s => saleBalance(s) <= 0);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(s => s.customer.toLowerCase().includes(q) || s.items.toLowerCase().includes(q) || s.salesperson.toLowerCase().includes(q)); }
    return list;
  }, [sales, filter, search, bounds]);

  const owedCount = filterByDate(sales, bounds).filter(s => saleBalance(s) > 0).length;
  const detailSale = detailModal ? sales.find(s => s.id === detailModal) : null;
  const paySale    = payModal    ? sales.find(s => s.id === payModal)    : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <Btn onClick={() => setAddModal(true)}>+ New Sale</Btn>
        <Btn onClick={() => setSpModal(true)} v="ghost">+ Salesperson</Btn>
        <Btn v="ghost" s={{ fontSize: 12 }} onClick={() => exportCSV(filtered, SALE_CSV_COLS, `sales-${today()}.csv`)}>⬇ Export CSV</Btn>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ padding: "9px 13px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", flex: mobile ? "1 1 100%" : "0 0 220px", minWidth: 0 }} />
        <div style={{ marginLeft: mobile ? 0 : "auto", display: "flex", gap: 4, background: "var(--card)", borderRadius: 8, padding: 3, flex: mobile ? "1 1 100%" : undefined }}>
          {[["all", "All"], ["owed", `Owed (${owedCount})`], ["paid", "Paid"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: filter === k ? "var(--accent)" : "transparent", color: filter === k ? "#fff" : "var(--dim)", flex: mobile ? 1 : undefined }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>{["Date","Customer","Salesperson","Total","Paid","Balance","Margin","Delivery",""].map(h => <TH key={h} right={["Total","Paid","Balance","Margin"].includes(h)}>{h}</TH>)}</tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>{search ? "No sales match your search." : "No sales in this period."}</td></tr>}
              {filtered.map(s => {
                const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
                const bal = s.price - paid;
                const margin = s.price > 0 ? (s.price - s.cost) / s.price : 0;
                return (
                  <tr key={s.id} onClick={() => setDetailModal(s.id)} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer", transition: "background 0.15s" }} {...hoverRow}>
                    <TD mono>{s.date}</TD>
                    <TD bold>{s.customer}</TD>
                    <TD><Badge text={s.salesperson || "—"} color="var(--accent)" bg="var(--accent-soft)" /></TD>
                    <TD right mono bold>{fmt(s.price)}</TD>
                    <TD right mono color="#2DD4A8">{fmt(paid)}</TD>
                    <TD right mono bold color={bal > 0 ? "#F59E0B" : "#2DD4A8"}>{bal > 0 ? fmt(bal) : "PAID"}</TD>
                    <TD right mono>{pct(margin)}</TD>
                    <TD><Badge text={s.delivered ? "Delivered" : "Pending"} color={s.delivered ? "#2DD4A8" : "#F59E0B"} bg={s.delivered ? "rgba(45,212,168,0.12)" : "rgba(244,158,11,0.12)"} /></TD>
                    <TD>{bal > 0 && <Btn v="ghost" s={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); setPayModal(s.id); }}>Pay</Btn>}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Sale" wide>
        <SaleForm form={addForm} setForm={setAddForm} salespeople={salespeople} showPayment />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setAddModal(false)}>Cancel</Btn>
          <Btn onClick={handleAddSale} disabled={saving}>{saving ? "Saving…" : "Save Sale"}</Btn>
        </div>
      </Modal>

      {/* Edit Sale Modal */}
      <Modal open={!!editModal} onClose={() => { setEditModal(null); setEditForm(null); }} title="Edit Sale" wide>
        {editForm && <SaleForm form={editForm} setForm={setEditForm} salespeople={salespeople} showPayment={false} />}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => { setEditModal(null); setEditForm(null); }}>Cancel</Btn>
          <Btn onClick={handleEditSale} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Btn>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Record Payment">
        {paySale && <div style={{ background: "var(--card)", borderRadius: 8, padding: 14, marginBottom: 18 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{paySale.customer}</div><div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>Balance due: <span style={{ color: "#F59E0B", fontWeight: 700, fontFamily: "var(--mono)" }}>{fmt(saleBalance(paySale))}</span></div></div>}
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Date" value={payForm.date} onChange={v => setPayForm(f => ({ ...f, date: v }))} type="date" half />
          <Field label="Amount *" value={payForm.amount} onChange={v => setPayForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" half />
        </div>
        <Field label="Method" value={payForm.method} onChange={v => setPayForm(f => ({ ...f, method: v }))} options={PAYMENT_TYPES} />
        <Field label="Note" value={payForm.note} onChange={v => setPayForm(f => ({ ...f, note: v }))} placeholder="Payment note" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setPayModal(null)}>Cancel</Btn>
          <Btn onClick={handleRecordPayment} disabled={saving}>{saving ? "Saving…" : "Record Payment"}</Btn>
        </div>
      </Modal>

      {/* Add Salesperson Modal */}
      <Modal open={spModal} onClose={() => setSpModal(false)} title="Add Salesperson">
        <Field label="Name" value={newSp} onChange={setNewSp} placeholder="Salesperson name" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setSpModal(false)}>Cancel</Btn>
          <Btn onClick={handleAddSp}>Add</Btn>
        </div>
      </Modal>

      {/* Sale Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Sale Details" wide>
        {detailSale && (() => {
          const paid = detailSale.payments.reduce((s, p) => s + p.amount, 0);
          const bal  = detailSale.price - paid;
          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 640 ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Customer</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{detailSale.customer}</div>
                  {detailSale.phone   && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{detailSale.phone}</div>}
                  {detailSale.address && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{detailSale.address}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Sale Info</div>
                  <div style={{ fontSize: 12, color: "var(--dim)" }}>Date: {detailSale.date} · Salesperson: {detailSale.salesperson}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>Items: {detailSale.items}</div>
                  {detailSale.deliveryDate && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>Delivery: {detailSale.deliveryDate} {detailSale.deliveryTime}</div>}
                </div>
              </div>

              {detailSale.notes && (
                <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, borderLeft: "3px solid var(--accent)" }}>
                  <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{detailSale.notes}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 640 ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                {[["Total", fmt(detailSale.price), null], ["Paid", fmt(paid), "#2DD4A8"], ["Balance", bal > 0 ? fmt(bal) : "PAID", bal > 0 ? "#F59E0B" : "#2DD4A8"], ["Margin", pct(detailSale.price > 0 ? (detailSale.price - detailSale.cost) / detailSale.price : 0), null]].map(([label, value, color]) => (
                  <div key={label} style={{ background: "var(--card)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)", color: color || "inherit" }}>{value}</div>
                  </div>
                ))}
              </div>

              {detailSale.payments.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Payment History</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["Date","Amount","Method","Note"].map(h => <TH key={h} right={h==="Amount"}>{h}</TH>)}</tr></thead>
                    <tbody>{detailSale.payments.map((p, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)" }}><TD mono>{p.date}</TD><TD right mono bold color="#2DD4A8">{fmt(p.amount)}</TD><TD>{p.method}</TD><TD color="var(--dim)">{p.note}</TD></tr>))}</tbody>
                  </table>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                <Btn v="danger" onClick={async () => { if (confirm("Delete this sale and all its payments?")) { await deleteSale(detailSale.id); setDetailModal(null); } }}>Delete</Btn>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn v="ghost" onClick={() => openEdit(detailSale)}>Edit Sale</Btn>
                  <Btn v={detailSale.delivered ? "danger" : "ghost"} onClick={() => toggleDelivered(detailSale.id, detailSale.delivered)}>{detailSale.delivered ? "Mark Undelivered" : "Mark Delivered"}</Btn>
                  {bal > 0 && <Btn onClick={() => { setDetailModal(null); setPayModal(detailSale.id); }}>Record Payment</Btn>}
                </div>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}

// ─── Deposits Tab ─────────────────────────────────────────────────────────────
function DepositsTab({ sales, bounds }) {
  const deposits = useMemo(() => buildDeposits(filterByDate(sales, bounds)), [sales, bounds]);
  return (
    <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, padding: "18px 22px 0" }}>Daily Deposits</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>{["Date","Visa/MC","AMEX","Cash","Finance","Check","COD","Total"].map(h => <TH key={h} right={h!=="Date"}>{h}</TH>)}</tr></thead>
          <tbody>
            {deposits.length === 0 && <tr><td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>No deposits in this period.</td></tr>}
            {[...deposits].reverse().map(d => {
              const total = d.visamc + d.amex + d.cash + d.finance + d.check + d.cod;
              return (
                <tr key={d.date} style={{ borderBottom: "1px solid var(--line)", transition: "background 0.15s" }} {...hoverRow}>
                  <TD mono>{d.date}</TD>
                  {[d.visamc, d.amex, d.cash, d.finance, d.check, d.cod].map((v, i) => <TD key={i} right mono>{fmt(v)}</TD>)}
                  <TD right mono bold color="var(--accent)">{fmt(total)}</TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────
function ExpensesTab({ expenses, addExpense, deleteExpense, bounds }) {
  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({ date: today(), category: EXPENSE_CATS[0].id, vendor: "", amount: "", note: "" });
  const catLookup = Object.fromEntries(EXPENSE_CATS.map(c => [c.id, c]));

  const filtered = useMemo(() => filterByDate(expenses, bounds), [expenses, bounds]);
  const total    = filtered.reduce((s, e) => s + e.amount, 0);

  const handleAdd = async () => {
    if (!form.vendor || !form.amount) return;
    setSaving(true);
    try { await addExpense(form); setForm({ date: today(), category: EXPENSE_CATS[0].id, vendor: "", amount: "", note: "" }); setModal(false); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  return (
    <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Expenses</h3>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>Total: {fmt(total)}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="ghost" s={{ fontSize: 12 }} onClick={() => exportCSV(filtered, EXPENSE_CSV_COLS, `expenses-${today()}.csv`)}>⬇ Export CSV</Btn>
          <Btn onClick={() => setModal(true)}>+ New Expense</Btn>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>{["Date","Category","Vendor","Amount","Note",""].map(h => <TH key={h} right={h==="Amount"}>{h}</TH>)}</tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>No expenses in this period.</td></tr>}
            {filtered.map(e => {
              const cat = catLookup[e.category];
              return (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--line)", transition: "background 0.15s" }} {...hoverRow}>
                  <TD mono>{e.date}</TD>
                  <TD>{cat?.label || e.category}</TD>
                  <TD bold>{e.vendor}</TD>
                  <TD right mono bold color="#D45B5B">{fmt(e.amount)}</TD>
                  <TD color="var(--dim)">{e.note}</TD>
                  <TD><Btn v="danger" s={{ padding: "3px 10px", fontSize: 11 }} onClick={() => { if (confirm("Delete this expense?")) deleteExpense(e.id); }}>×</Btn></TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Expense">
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" half />
          <Field label="Category" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={EXPENSE_CATS.map(c => ({ value: c.id, label: c.label }))} half />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Vendor *" value={form.vendor} onChange={v => setForm(f => ({ ...f, vendor: v }))} placeholder="Vendor name" half />
          <Field label="Amount *" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" half />
        </div>
        <Field label="Note" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="Description" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Save Expense"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { authed, login, logout } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [dateRange, setDateRange] = useState({ preset: "thisMonth", from: "", to: "" });
  const { sales, expenses, salespeople, loading, error, addSale, editSale, recordPayment, toggleDelivered, deleteSale, addExpense, deleteExpense, addSalesperson, reload } = useData();
  const w = useWidth();
  const mobile = w < 640;
  const tablet = w < 900;

  const bounds = getDateBounds(dateRange.preset, dateRange.from, dateRange.to);
  const filteredSales    = useMemo(() => filterByDate(sales, bounds),    [sales, bounds]);
  const filteredExpenses = useMemo(() => filterByDate(expenses, bounds), [expenses, bounds]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "sales",     label: "Sales",     icon: "🛏"  },
    { id: "deposits",  label: "Deposits",  icon: "🏦"  },
    { id: "expenses",  label: "Expenses",  icon: "💸"  },
  ];
  const owedCount = filteredSales.filter(s => saleBalance(s) > 0).length;

  if (!authed) return <LockScreen onLogin={login} />;

  return (
    <div style={{ "--bg": "#0F1118", "--card": "#181B25", "--line": "#252836", "--text": "#E8E9ED", "--dim": "#6B7084", "--accent": "#5B8DEF", "--accent-soft": "rgba(91,141,239,0.12)", "--font": "'DM Sans', system-ui, sans-serif", "--mono": "'JetBrains Mono', 'Consolas', monospace", fontFamily: "var(--font)", color: "var(--text)", background: "var(--bg)", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: mobile ? "0 12px" : "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #5B8DEF, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>S</div>
          {!mobile && <div><div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>StorTrack</div><div style={{ fontSize: 8, color: "var(--dim)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Small Business Finance</div></div>}
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "var(--accent-soft)" : "transparent", color: tab === t.id ? "var(--accent)" : "var(--dim)", border: "none", padding: mobile ? "7px 10px" : "7px 14px", borderRadius: 8, fontSize: mobile ? 11 : 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, position: "relative" }}>
              <span style={{ fontSize: mobile ? 15 : 14 }}>{t.icon}</span>
              {!mobile && t.label}
              {mobile && tab === t.id && <span style={{ fontSize: 11 }}>{t.label}</span>}
              {t.id === "sales" && owedCount > 0 && <span style={{ position: "absolute", top: 1, right: mobile ? 0 : 3, width: 15, height: 15, borderRadius: "50%", background: "#F59E0B", color: "#000", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{owedCount}</span>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!mobile && <button onClick={reload} title="Refresh" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--dim)", fontSize: 16, padding: "4px 8px" }}>↻</button>}
          <button onClick={logout} style={{ background: "none", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", color: "var(--dim)", fontSize: 11, fontWeight: 600, padding: "4px 10px", fontFamily: "inherit" }}>Lock</button>
        </div>
      </div>

      {/* Date Range Bar */}
      <div style={{ position: "sticky", top: 56, zIndex: 99 }}>
        <DateRangeBar range={dateRange} setRange={setDateRange} mobile={mobile} />
      </div>

      {/* Content */}
      <div style={{ padding: mobile ? "16px 12px" : tablet ? "20px 20px" : "24px 28px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ marginBottom: mobile ? 16 : 24 }}>
          <h1 style={{ margin: 0, fontSize: mobile ? 17 : 20, fontWeight: 700 }}>{tabs.find(t => t.id === tab)?.label}</h1>
          <p style={{ margin: "4px 0 0", fontSize: mobile ? 11 : 12, color: "var(--dim)" }}>
            {tab === "dashboard" && "Revenue, profit, outstanding balances, and expense overview."}
            {tab === "sales"     && "Track sales, partial payments, and customer balances."}
            {tab === "deposits"  && "Auto-generated from every payment received."}
            {tab === "expenses"  && "All outgoing cash organized by category."}
          </p>
        </div>

        {error && <div style={{ background: "#D45B5B22", border: "1px solid #D45B5B44", borderRadius: 10, padding: "14px 18px", marginBottom: 20, color: "#D45B5B", fontSize: 13 }}>⚠ {error} — <button onClick={reload} style={{ background: "none", border: "none", color: "#5B8DEF", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Retry</button></div>}

        {loading ? <Spinner /> : (
          <>
            {tab === "dashboard" && <DashboardTab sales={filteredSales} expenses={filteredExpenses} salespeople={salespeople} mobile={tablet} />}
            {tab === "sales"     && <SalesTab sales={sales} addSale={addSale} editSale={editSale} recordPayment={recordPayment} toggleDelivered={toggleDelivered} deleteSale={deleteSale} salespeople={salespeople} addSalesperson={addSalesperson} mobile={mobile} bounds={bounds} />}
            {tab === "deposits"  && <DepositsTab sales={sales} bounds={bounds} />}
            {tab === "expenses"  && <ExpensesTab expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} bounds={bounds} />}
          </>
        )}
      </div>
    </div>
  );
}
