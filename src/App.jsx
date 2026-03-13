import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth }     from "./hooks/useAuth.js";
import { useSettings } from "./hooks/useSettings.js";
import { useData }     from "./hooks/useData.js";
import { InventoryTab } from "./components/InventoryTab.jsx";
import { VendorsTab }   from "./components/VendorsTab.jsx";
import { LogsTab }      from "./components/LogsTab.jsx";
import { Modal, Field, Btn, TH, TD, Badge, hoverRow, StatCard, Bar, Spinner, ReasonModal, LineItemBuilder } from "./components/ui.jsx";
import { today, fmt, pct, daysSince, saleBalance, isOverdue, getDateBounds, filterByDate, exportCSV, buildDeposits, buildMonthlyPL, PAYMENT_TYPES, EXPENSE_CATS, SALE_CSV_COLS, EXPENSE_CSV_COLS } from "./utils.js";

// ─── Lock Screen ──────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return w;
}

// ─── Date Range Bar ───────────────────────────────────────────────────────────
function DateRangeBar({ range, setRange, mobile }) {
  const presets = [["all","All Time"],["thisMonth","This Month"],["lastMonth","Last Month"],["custom","Custom"]];
  return (
    <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: mobile ? "8px 12px" : "8px 28px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Period:</span>
      <div style={{ display: "flex", gap: 3, background: "var(--bg)", borderRadius: 8, padding: 3 }}>
        {presets.map(([k, l]) => (
          <button key={k} onClick={() => setRange(r => ({ ...r, preset: k }))}
            style={{ padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: range.preset === k ? "var(--accent)" : "transparent", color: range.preset === k ? "#fff" : "var(--dim)" }}>{l}</button>
        ))}
      </div>
      {range.preset === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
          <span style={{ color: "var(--dim)", fontSize: 12 }}>→</span>
          <input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
        </div>
      )}
      {range.preset !== "all" && (() => { const b = getDateBounds(range.preset, range.from, range.to); if (b.from) return <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)" }}>{b.from} → {b.to || today()}</span>; })()}
    </div>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ open, onClose, settings, save, salespeople }) {
  const [form, setForm] = useState(null);
  useEffect(() => { if (open) setForm({ storeName: settings.storeName, overdueDays: String(settings.overdueDays), commissions: { ...settings.commissions } }); }, [open]);
  if (!open || !form) return null;
  const handleSave = () => {
    save({ storeName: form.storeName.trim() || "StorTrack", overdueDays: parseInt(form.overdueDays) || 7, commissions: Object.fromEntries(Object.entries(form.commissions).map(([k, v]) => [k, parseFloat(v) || 0])) });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <Field label="Store Name" value={form.storeName} onChange={v => setForm(f => ({ ...f, storeName: v }))} placeholder="Your store name" />
      <Field label="Overdue Threshold (days)" value={form.overdueDays} onChange={v => setForm(f => ({ ...f, overdueDays: v }))} type="number" placeholder="7" />
      {salespeople.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Commission Rates (%)</label>
          {salespeople.map(sp => (
            <div key={sp} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 80 }}>{sp}</span>
              <input type="number" value={form.commissions[sp] ?? ""} onChange={e => setForm(f => ({ ...f, commissions: { ...f.commissions, [sp]: e.target.value } }))} placeholder="0" min="0" max="100" step="0.5"
                style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", width: 90 }} />
              <span style={{ fontSize: 12, color: "var(--dim)" }}>%</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn v="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave}>Save Settings</Btn>
      </div>
    </Modal>
  );
}

// ─── Customer History Modal ───────────────────────────────────────────────────
function CustomerHistoryModal({ open, onClose, customer, sales }) {
  const cs = useMemo(() => (sales || []).filter(s => s.customer === customer && !s.cancelledAt).sort((a, b) => b.date.localeCompare(a.date)), [sales, customer]);
  const totalRev  = cs.reduce((s, x) => s + x.price, 0);
  const totalPaid = cs.reduce((s, x) => s + x.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const totalBal  = cs.reduce((s, x) => s + saleBalance(x), 0);
  return (
    <Modal open={open} onClose={onClose} title={`${customer} — History`} wide>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[["Purchases", fmt(totalRev), "#2DD4A8"], ["Paid", fmt(totalPaid), "#5B8DEF"], ["Outstanding", fmt(totalBal), totalBal > 0 ? "#F59E0B" : "#2DD4A8"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)", color: c, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>{["Date","Items","Total","Paid","Balance","Status"].map(h => <TH key={h} right={["Total","Paid","Balance"].includes(h)}>{h}</TH>)}</tr></thead>
          <tbody>
            {cs.map(s => {
              const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
              const bal  = s.price - paid;
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <TD mono>{s.date}</TD>
                  <TD style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{s.items}</TD>
                  <TD right mono bold>{fmt(s.price)}</TD>
                  <TD right mono color="#2DD4A8">{fmt(paid)}</TD>
                  <TD right mono bold color={bal > 0 ? "#F59E0B" : "#2DD4A8"}>{bal > 0 ? fmt(bal) : "PAID"}</TD>
                  <TD><Badge text={s.delivered ? "Delivered" : "Pending"} color={s.delivered ? "#2DD4A8" : "#F59E0B"} bg={s.delivered ? "rgba(45,212,168,0.12)" : "rgba(244,158,11,0.12)"} /></TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ─── Sale Form ────────────────────────────────────────────────────────────────
const blankSaleForm = (sp) => ({ date: today(), customer: "", phone: "", items: "", address: "", price: "", cost: "", salesperson: sp || "", deliveryDate: "", deliveryTime: "", notes: "" });
const blankInitPay  = () => ({ amount: "", method: "Visa/MC", note: "Initial deposit" });

function SaleFormFields({ form, setForm, salespeople }) {
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
      <Field label="Delivery Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Full address" />
      <div style={{ display: "flex", gap: 12 }}>
        <Field label="Delivery Date" value={form.deliveryDate} onChange={v => setForm(f => ({ ...f, deliveryDate: v }))} type="date" half />
        <Field label="Delivery Time" value={form.deliveryTime} onChange={v => setForm(f => ({ ...f, deliveryTime: v }))} placeholder="e.g. 2-5pm" half />
      </div>
      <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Internal notes…" multiline />
    </>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ sales, expenses, salespeople, mobile, settings }) {
  const totalRevenue   = sales.reduce((s, x) => s + x.price, 0);
  const totalCost      = sales.reduce((s, x) => s + x.cost, 0);
  const totalProfit    = totalRevenue - totalCost;
  const avgMargin      = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
  const totalCollected = sales.reduce((s, sale) => s + sale.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const totalOwed      = totalRevenue - totalCollected;
  const totalExpenses  = expenses.reduce((s, x) => s + x.amount, 0);
  const cashFlow       = totalCollected - totalExpenses;
  const owedSales      = sales.filter(s => saleBalance(s) > 0 && !s.cancelledAt).sort((a, b) => saleBalance(b) - saleBalance(a));
  const overdueSales   = owedSales.filter(s => isOverdue(s, settings.overdueDays));

  const spData = salespeople.map(sp => {
    const ss = sales.filter(s => s.salesperson === sp);
    const rev = ss.reduce((s, x) => s + x.price, 0);
    const cost = ss.reduce((s, x) => s + x.cost, 0);
    return { name: sp, count: ss.length, revenue: rev, profit: rev - cost, margin: rev > 0 ? (rev - cost) / rev : 0 };
  }).sort((a, b) => b.revenue - a.revenue);
  const maxRev = Math.max(...spData.map(s => s.revenue), 1);

  const expByCat = EXPENSE_CATS.map(cat => ({ ...cat, total: expenses.filter(e => e.category === cat.id).reduce((s, x) => s + x.amount, 0) })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  const maxExp   = Math.max(...expByCat.map(e => e.total), 1);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Revenue" value={fmt(totalRevenue)} sub={`${sales.length} sales`} accent="#2DD4A8" />
        <StatCard label="Collected" value={fmt(totalCollected)} sub="Payments received" accent="#5B8DEF" />
        <StatCard label="Outstanding" value={fmt(totalOwed)} sub={`${owedSales.length} customer${owedSales.length !== 1 ? "s" : ""} owe`} accent={totalOwed > 0 ? "#F59E0B" : "#2DD4A8"} />
        <StatCard label="Gross Profit" value={fmt(totalProfit)} sub={`Margin: ${pct(avgMargin)}`} accent="#8B5CF6" />
        <StatCard label="Cash Flow" value={fmt(cashFlow)} sub="Collected - Expenses" accent={cashFlow >= 0 ? "#2DD4A8" : "#D45B5B"} />
      </div>

      {overdueSales.length > 0 && (
        <div style={{ background: "#D45B5B15", border: "1px solid #D45B5B33", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#D45B5B", marginBottom: 10 }}>🚨 {overdueSales.length} Overdue (&gt;{settings.overdueDays} days)</div>
          {overdueSales.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span><span style={{ fontWeight: 600 }}>{s.customer}</span><span style={{ color: "var(--dim)", marginLeft: 8, fontSize: 11 }}>{daysSince(s.date)} days ago</span></span>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "#D45B5B" }}>{fmt(saleBalance(s))}</span>
            </div>
          ))}
        </div>
      )}

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
                  <Bar value={sp.revenue} max={maxRev} color={["#2DD4A8","#5B8DEF","#8B5CF6","#F59E0B"][i % 4]} />
                  <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 3 }}>
                    {sp.count} sale{sp.count !== 1 ? "s" : ""} · {fmt(sp.profit)} profit
                    {settings.commissions[sp.name] ? <span style={{ color: "#2DD4A8", marginLeft: 8 }}>Commission: {fmt(sp.revenue * settings.commissions[sp.name] / 100)}</span> : ""}
                  </div>
                </div>
              ))}
          </div>
          {owedSales.length > 0 && (
            <div style={{ background: "var(--card)", borderRadius: 12, padding: 22, borderLeft: "4px solid #F59E0B" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>⚠ Outstanding Balances</h3>
              {owedSales.map(sale => {
                const bal = saleBalance(sale); const paidPct = sale.price > 0 ? (sale.price - bal) / sale.price : 0;
                const overdue = isOverdue(sale, settings.overdueDays);
                return (
                  <div key={sale.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{sale.customer}</span>
                        {overdue && <Badge text={`${daysSince(sale.date)}d overdue`} color="#D45B5B" bg="#D45B5B15" />}
                      </div>
                      <span style={{ fontWeight: 700, fontFamily: "var(--mono)", color: "#F59E0B" }}>{fmt(bal)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}><Bar value={sale.price - bal} max={sale.price} color="#F59E0B" /></div>
                      <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>{pct(paidPct)} paid</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ background: "var(--card)", borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Expense Breakdown</h3>
          <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 14 }}>Total: {fmt(totalExpenses)}</div>
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
function SalesTab({ sales, addSale, editSale, cancelSale, deleteSale, recordPayment, deletePayment, toggleDelivered, salespeople, addSalesperson, mobile, bounds, settings, products }) {
  const [addModal, setAddModal]           = useState(false);
  const [editModal, setEditModal]         = useState(null);
  const [payModal, setPayModal]           = useState(null);
  const [spModal, setSpModal]             = useState(false);
  const [detailModal, setDetailModal]     = useState(null);
  const [customerModal, setCustomerModal] = useState(null);
  const [reasonModal, setReasonModal]     = useState(null); // { type, id, paymentId? }
  const [newSp, setNewSp]                 = useState("");
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState("all");
  const [saving, setSaving]               = useState(false);
  const [addForm, setAddForm]             = useState(() => blankSaleForm(salespeople[0]));
  const [lineItems, setLineItems]         = useState([]);
  const [initPay, setInitPay]             = useState(blankInitPay());
  const [editForm, setEditForm]           = useState(null);
  const [payForm, setPayForm]             = useState({ date: today(), amount: "", method: "Visa/MC", note: "" });

  useEffect(() => { if (salespeople.length && !addForm.salesperson) setAddForm(f => ({ ...f, salesperson: salespeople[0] })); }, [salespeople]);

  // Build flat variant catalog
  const catalog = useMemo(() => products.flatMap(p => p.variants.map(v => ({ id: v.id, productName: p.name, size: v.size, cost: v.cost, retailPrice: v.retailPrice, quantityOnHand: v.quantityOnHand }))), [products]);

  const handleAddSale = async () => {
    if (!addForm.customer) return;
    if (!lineItems.length && !addForm.price) return;
    setSaving(true);
    try {
      await addSale(addForm, Number(initPay.amount) > 0 ? initPay : null, lineItems.filter(i => i.description || i.variantId));
      setAddForm(blankSaleForm(salespeople[0])); setLineItems([]); setInitPay(blankInitPay()); setAddModal(false);
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleEditSale = async (reason) => {
    if (!editForm?.customer) return;
    setSaving(true);
    try { await editSale(editModal.id, editForm, reason); setEditModal(null); setEditForm(null); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleRecordPayment = async () => {
    if (!payForm.amount || !payModal) return;
    setSaving(true);
    try { await recordPayment(payModal, payForm); setPayForm({ date: today(), amount: "", method: "Visa/MC", note: "" }); setPayModal(null); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleReasonConfirm = async (reason) => {
    if (!reasonModal) return;
    const { type, id, paymentId } = reasonModal;
    if (type === "cancel")        await cancelSale(id, reason);
    if (type === "delete")        await deleteSale(id, reason);
    if (type === "deletePayment") await deletePayment(paymentId, reason);
    setReasonModal(null); setDetailModal(null);
  };

  const openEdit = (sale) => {
    setEditForm({ date: sale.date, customer: sale.customer, phone: sale.phone, items: sale.items, address: sale.address, price: String(sale.price), cost: String(sale.cost), salesperson: sale.salesperson, deliveryDate: sale.deliveryDate, deliveryTime: sale.deliveryTime, notes: sale.notes });
    setEditModal(sale); setDetailModal(null);
  };

  const filtered = useMemo(() => {
    let list = filterByDate([...sales], bounds);
    if (filter === "owed")    list = list.filter(s => saleBalance(s) > 0 && !s.cancelledAt);
    if (filter === "paid")    list = list.filter(s => saleBalance(s) <= 0 && !s.cancelledAt);
    if (filter === "overdue") list = list.filter(s => isOverdue(s, settings.overdueDays));
    if (filter === "cancelled") list = list.filter(s => s.cancelledAt);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(s => s.customer.toLowerCase().includes(q) || s.items.toLowerCase().includes(q) || s.salesperson.toLowerCase().includes(q)); }
    return list;
  }, [sales, filter, search, bounds, settings.overdueDays]);

  const fSales     = filterByDate(sales, bounds);
  const owedCount    = fSales.filter(s => saleBalance(s) > 0 && !s.cancelledAt).length;
  const overdueCount = fSales.filter(s => isOverdue(s, settings.overdueDays)).length;
  const cancelledCount = fSales.filter(s => s.cancelledAt).length;
  const detailSale = detailModal ? sales.find(s => s.id === detailModal) : null;
  const paySale    = payModal    ? sales.find(s => s.id === payModal)    : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <Btn onClick={() => { setAddForm(blankSaleForm(salespeople[0])); setLineItems([]); setInitPay(blankInitPay()); setAddModal(true); }}>+ New Sale</Btn>
        <Btn onClick={() => setSpModal(true)} v="ghost">+ Salesperson</Btn>
        <Btn v="ghost" s={{ fontSize: 12 }} onClick={() => exportCSV(filtered, SALE_CSV_COLS, `sales-${today()}.csv`)}>⬇ Export</Btn>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ padding: "9px 13px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", flex: mobile ? "1 1 100%" : "0 0 200px", minWidth: 0 }} />
        <div style={{ marginLeft: mobile ? 0 : "auto", display: "flex", gap: 3, background: "var(--card)", borderRadius: 8, padding: 3, flexWrap: "wrap", flex: mobile ? "1 1 100%" : undefined }}>
          {[["all","All"],["owed",`Owed(${owedCount})`],["paid","Paid"],["overdue",overdueCount > 0 ? `🚨(${overdueCount})` : "Overdue"],["cancelled",`Cancelled(${cancelledCount})`]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "6px 11px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: filter === k ? (k === "overdue" ? "#D45B5B" : k === "cancelled" ? "#6B7084" : "var(--accent)") : "transparent", color: filter === k ? "#fff" : k === "overdue" && overdueCount > 0 ? "#D45B5B" : "var(--dim)", flex: mobile ? 1 : undefined }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>{["Date","Customer","Salesperson","Total","Paid","Balance","Margin","Status",""].map(h => <TH key={h} right={["Total","Paid","Balance","Margin"].includes(h)}>{h}</TH>)}</tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>No sales in this period.</td></tr>}
              {filtered.map(s => {
                const paid   = s.payments.reduce((sum, p) => sum + p.amount, 0);
                const bal    = s.price - paid;
                const margin = s.price > 0 ? (s.price - s.cost) / s.price : 0;
                const overdue = isOverdue(s, settings.overdueDays);
                return (
                  <tr key={s.id} onClick={() => setDetailModal(s.id)} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer", transition: "background 0.15s", background: s.cancelledAt ? "rgba(107,112,132,0.05)" : overdue ? "rgba(212,91,91,0.04)" : "transparent", opacity: s.cancelledAt ? 0.6 : 1 }} {...hoverRow}>
                    <TD mono>{s.date}</TD>
                    <TD bold>
                      <span onClick={e => { e.stopPropagation(); setCustomerModal(s.customer); }} style={{ cursor: "pointer", borderBottom: "1px dashed var(--dim)" }}>{s.customer}</span>
                      {s.cancelledAt && <Badge text="Cancelled" color="#6B7084" bg="rgba(107,112,132,0.15)" />}
                    </TD>
                    <TD><Badge text={s.salesperson || "—"} color="var(--accent)" bg="var(--accent-soft)" /></TD>
                    <TD right mono bold>{fmt(s.price)}</TD>
                    <TD right mono color="#2DD4A8">{fmt(paid)}</TD>
                    <TD right mono bold color={overdue ? "#D45B5B" : bal > 0 ? "#F59E0B" : "#2DD4A8"}>{s.cancelledAt ? "—" : bal > 0 ? fmt(bal) : "PAID"}</TD>
                    <TD right mono>{pct(margin)}</TD>
                    <TD><Badge text={s.cancelledAt ? "Cancelled" : s.delivered ? "Delivered" : "Pending"} color={s.cancelledAt ? "#6B7084" : s.delivered ? "#2DD4A8" : "#F59E0B"} bg={s.cancelledAt ? "rgba(107,112,132,0.15)" : s.delivered ? "rgba(45,212,168,0.12)" : "rgba(244,158,11,0.12)"} /></TD>
                    <TD>{!s.cancelledAt && bal > 0 && <Btn v="ghost" s={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); setPayModal(s.id); }}>Pay</Btn>}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sale */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Sale" wide>
        <SaleFormFields form={addForm} setForm={setAddForm} salespeople={salespeople} />
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 16 }}>
          <LineItemBuilder items={lineItems} setItems={setLineItems} catalog={catalog} />
          {!lineItems.length && (
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <Field label="Total Price (if no line items)" value={addForm.price} onChange={v => setAddForm(f => ({ ...f, price: v }))} type="number" placeholder="0.00" half />
              <Field label="Cost" value={addForm.cost} onChange={v => setAddForm(f => ({ ...f, cost: v }))} type="number" placeholder="0.00" half />
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 10, textTransform: "uppercase" }}>Initial Payment (optional)</div>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Amount" value={initPay.amount} onChange={v => setInitPay(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" half />
            <Field label="Method" value={initPay.method} onChange={v => setInitPay(f => ({ ...f, method: v }))} options={PAYMENT_TYPES} half />
          </div>
          <Field label="Note" value={initPay.note} onChange={v => setInitPay(f => ({ ...f, note: v }))} placeholder="Payment note" />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setAddModal(false)}>Cancel</Btn>
          <Btn onClick={handleAddSale} disabled={saving}>{saving ? "Saving…" : "Save Sale"}</Btn>
        </div>
      </Modal>

      {/* Edit Sale — requires reason */}
      <Modal open={!!editModal} onClose={() => { setEditModal(null); setEditForm(null); }} title="Edit Sale" wide>
        {editForm && <>
          <SaleFormFields form={editForm} setForm={setEditForm} salespeople={salespeople} />
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <Field label="Price" value={editForm.price} onChange={v => setEditForm(f => ({ ...f, price: v }))} type="number" half />
            <Field label="Cost" value={editForm.cost} onChange={v => setEditForm(f => ({ ...f, cost: v }))} type="number" half />
          </div>
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 4 }}>
            <Field label="Reason for edit *" value={editForm._reason || ""} onChange={v => setEditForm(f => ({ ...f, _reason: v }))} placeholder="Why is this sale being edited?" multiline />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn v="ghost" onClick={() => { setEditModal(null); setEditForm(null); }}>Cancel</Btn>
            <Btn onClick={() => handleEditSale(editForm._reason)} disabled={saving || !editForm._reason?.trim()}>{saving ? "…" : "Save Changes"}</Btn>
          </div>
        </>}
      </Modal>

      {/* Record Payment */}
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
          <Btn onClick={handleRecordPayment} disabled={saving}>{saving ? "…" : "Record Payment"}</Btn>
        </div>
      </Modal>

      {/* Add Salesperson */}
      <Modal open={spModal} onClose={() => setSpModal(false)} title="Add Salesperson">
        <Field label="Name" value={newSp} onChange={setNewSp} placeholder="Name" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setSpModal(false)}>Cancel</Btn>
          <Btn onClick={async () => { if (!newSp.trim()) return; try { await addSalesperson(newSp.trim()); setNewSp(""); setSpModal(false); } catch (e) { alert(e.message); } }}>Add</Btn>
        </div>
      </Modal>

      {/* Sale Detail */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Sale Details" wide>
        {detailSale && (() => {
          const paid = detailSale.payments.reduce((s, p) => s + p.amount, 0);
          const bal  = detailSale.price - paid;
          const overdue = isOverdue(detailSale, settings.overdueDays);
          return (
            <>
              {detailSale.cancelledAt && <div style={{ background: "#6B708415", border: "1px solid #6B708433", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>⛔ Cancelled — {detailSale.cancelledReason}</div>}
              <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 640 ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Customer</div>
                  <div style={{ fontWeight: 600, fontSize: 15, cursor: "pointer", borderBottom: "1px dashed var(--dim)", display: "inline" }} onClick={() => { setDetailModal(null); setCustomerModal(detailSale.customer); }}>{detailSale.customer}</div>
                  {overdue && <Badge text={`${daysSince(detailSale.date)}d overdue`} color="#D45B5B" bg="#D45B5B15" />}
                  {detailSale.phone   && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>{detailSale.phone}</div>}
                  {detailSale.address && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{detailSale.address}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Sale Info</div>
                  <div style={{ fontSize: 12, color: "var(--dim)" }}>Date: {detailSale.date} · {detailSale.salesperson}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{detailSale.items}</div>
                  {detailSale.deliveryDate && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>Delivery: {detailSale.deliveryDate} {detailSale.deliveryTime}</div>}
                </div>
              </div>
              {detailSale.notes && <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, borderLeft: "3px solid var(--accent)", fontSize: 13, whiteSpace: "pre-wrap" }}>{detailSale.notes}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                {[["Total",fmt(detailSale.price),null],["Paid",fmt(paid),"#2DD4A8"],["Balance",bal>0?fmt(bal):"PAID",overdue?"#D45B5B":bal>0?"#F59E0B":"#2DD4A8"],["Margin",pct(detailSale.price>0?(detailSale.price-detailSale.cost)/detailSale.price:0),null]].map(([l,v,c]) => (
                  <div key={l} style={{ background: "var(--card)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)", color: c || "inherit" }}>{v}</div>
                  </div>
                ))}
              </div>
              {detailSale.payments.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Payments</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["Date","Amount","Method","Note",""].map(h => <TH key={h} right={h==="Amount"}>{h}</TH>)}</tr></thead>
                    <tbody>
                      {detailSale.payments.map((p, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                          <TD mono>{p.date}</TD>
                          <TD right mono bold color="#2DD4A8">{fmt(p.amount)}</TD>
                          <TD>{p.method}</TD>
                          <TD color="var(--dim)">{p.note}</TD>
                          <TD><button onClick={() => setReasonModal({ type: "deletePayment", id: detailSale.id, paymentId: p.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "#D45B5B", fontSize: 14, padding: "2px 6px" }} title="Refund / remove">×</button></TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {!detailSale.cancelledAt && <Btn v="danger" s={{ fontSize: 12 }} onClick={() => setReasonModal({ type: "cancel", id: detailSale.id })}>Cancel Sale</Btn>}
                  <Btn v="danger" s={{ fontSize: 12 }} onClick={() => setReasonModal({ type: "delete", id: detailSale.id })}>Delete</Btn>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {!detailSale.cancelledAt && <Btn v="ghost" s={{ fontSize: 12 }} onClick={() => openEdit(detailSale)}>Edit</Btn>}
                  {!detailSale.cancelledAt && <Btn v={detailSale.delivered ? "danger" : "ghost"} s={{ fontSize: 12 }} onClick={() => toggleDelivered(detailSale.id, detailSale.delivered)}>{detailSale.delivered ? "Mark Undelivered" : "Mark Delivered"}</Btn>}
                  {!detailSale.cancelledAt && bal > 0 && <Btn s={{ fontSize: 12 }} onClick={() => { setDetailModal(null); setPayModal(detailSale.id); }}>Record Payment</Btn>}
                </div>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Reason modal for destructive actions */}
      <ReasonModal
        open={!!reasonModal}
        onClose={() => setReasonModal(null)}
        onConfirm={handleReasonConfirm}
        title={reasonModal?.type === "cancel" ? "Cancel Sale" : reasonModal?.type === "deletePayment" ? "Refund / Remove Payment" : "Delete Sale"}
        placeholder={reasonModal?.type === "cancel" ? "Reason for cancellation…" : reasonModal?.type === "deletePayment" ? "Reason for refund…" : "Reason for deletion…"}
        confirmLabel={reasonModal?.type === "cancel" ? "Cancel Sale" : reasonModal?.type === "deletePayment" ? "Remove Payment" : "Delete Sale"}
        v="danger"
      />

      <CustomerHistoryModal open={!!customerModal} onClose={() => setCustomerModal(null)} customer={customerModal} sales={sales} />
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
  const [reasonModal, setReasonModal] = useState(null);
  const [form, setForm]     = useState({ date: today(), category: EXPENSE_CATS[0].id, vendor: "", amount: "", note: "" });
  const catLookup = Object.fromEntries(EXPENSE_CATS.map(c => [c.id, c]));
  const filtered  = useMemo(() => filterByDate(expenses, bounds), [expenses, bounds]);
  const total     = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px" }}>
        <div><h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Expenses</h3><div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>Total: {fmt(total)}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="ghost" s={{ fontSize: 12 }} onClick={() => exportCSV(filtered, EXPENSE_CSV_COLS, `expenses-${today()}.csv`)}>⬇ Export</Btn>
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
                  <TD mono>{e.date}</TD><TD>{cat?.label || e.category}</TD><TD bold>{e.vendor}</TD>
                  <TD right mono bold color="#D45B5B">{fmt(e.amount)}</TD>
                  <TD color="var(--dim)">{e.note}</TD>
                  <TD><Btn v="danger" s={{ padding: "3px 10px", fontSize: 11 }} onClick={() => setReasonModal(e.id)}>×</Btn></TD>
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
          <Btn onClick={async () => { if (!form.vendor || !form.amount) return; setSaving(true); try { await addExpense(form); setForm({ date: today(), category: EXPENSE_CATS[0].id, vendor: "", amount: "", note: "" }); setModal(false); } catch (e) { alert(e.message); } setSaving(false); }} disabled={saving}>{saving ? "…" : "Save"}</Btn>
        </div>
      </Modal>
      <ReasonModal open={!!reasonModal} onClose={() => setReasonModal(null)} onConfirm={async (reason) => { await deleteExpense(reasonModal, reason); setReasonModal(null); }} title="Delete Expense" placeholder="Reason for deletion…" confirmLabel="Delete" v="danger" />
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ sales, expenses, salespeople, settings }) {
  const monthly = useMemo(() => buildMonthlyPL(sales, expenses), [sales, expenses]);
  const fmtMonth = (m) => { const [y, mo] = m.split("-"); return new Date(y, mo - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" }); };
  const commissionData = salespeople.map(sp => {
    const ss = sales.filter(s => s.salesperson === sp && !s.cancelledAt);
    const rev = ss.reduce((s, x) => s + x.price, 0);
    const rate = settings.commissions[sp] || 0;
    return { name: sp, revenue: rev, rate, payout: rev * rate / 100, count: ss.length };
  }).filter(d => d.rate > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Monthly P&L</h3>
          <Btn v="ghost" s={{ fontSize: 12 }} onClick={() => exportCSV(monthly, [{ label: "Month", get: r => r.month },{ label: "Revenue", get: r => r.revenue },{ label: "Cost", get: r => r.cost },{ label: "Profit", get: r => r.profit },{ label: "Margin %", get: r => pct(r.margin) },{ label: "Collected", get: r => r.collected },{ label: "Expenses", get: r => r.expenses },{ label: "Cash Flow", get: r => r.cashFlow }], `pl-${today()}.csv`)}>⬇ Export</Btn>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>{["Month","Revenue","Cost","Gross Profit","Margin","Collected","Expenses","Cash Flow"].map(h => <TH key={h} right={h!=="Month"}>{h}</TH>)}</tr></thead>
            <tbody>
              {monthly.length === 0 && <tr><td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>No data yet.</td></tr>}
              {monthly.map(m => (
                <tr key={m.month} style={{ borderBottom: "1px solid var(--line)", transition: "background 0.15s" }} {...hoverRow}>
                  <TD bold>{fmtMonth(m.month)}</TD>
                  <TD right mono color="#2DD4A8">{fmt(m.revenue)}</TD><TD right mono color="#D45B5B">{fmt(m.cost)}</TD>
                  <TD right mono bold color={m.profit >= 0 ? "#2DD4A8" : "#D45B5B"}>{fmt(m.profit)}</TD>
                  <TD right mono>{pct(m.margin)}</TD>
                  <TD right mono color="#5B8DEF">{fmt(m.collected)}</TD><TD right mono color="#D45B5B">{fmt(m.expenses)}</TD>
                  <TD right mono bold color={m.cashFlow >= 0 ? "#2DD4A8" : "#D45B5B"}>{fmt(m.cashFlow)}</TD>
                </tr>
              ))}
              {monthly.length > 1 && (() => {
                const t = monthly.reduce((a, m) => ({ revenue: a.revenue+m.revenue, cost: a.cost+m.cost, profit: a.profit+m.profit, collected: a.collected+m.collected, expenses: a.expenses+m.expenses, cashFlow: a.cashFlow+m.cashFlow }), { revenue:0,cost:0,profit:0,collected:0,expenses:0,cashFlow:0 });
                return (
                  <tr style={{ borderTop: "2px solid var(--line)", background: "rgba(91,141,239,0.04)" }}>
                    <TD bold style={{ fontSize: 11, textTransform: "uppercase" }}>Total</TD>
                    <TD right mono bold color="#2DD4A8">{fmt(t.revenue)}</TD><TD right mono bold color="#D45B5B">{fmt(t.cost)}</TD>
                    <TD right mono bold color={t.profit>=0?"#2DD4A8":"#D45B5B"}>{fmt(t.profit)}</TD>
                    <TD right mono bold>{pct(t.revenue>0?t.profit/t.revenue:0)}</TD>
                    <TD right mono bold color="#5B8DEF">{fmt(t.collected)}</TD><TD right mono bold color="#D45B5B">{fmt(t.expenses)}</TD>
                    <TD right mono bold color={t.cashFlow>=0?"#2DD4A8":"#D45B5B"}>{fmt(t.cashFlow)}</TD>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
      {commissionData.length > 0 && (
        <div style={{ background: "var(--card)", borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Commission Calculator</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>{["Salesperson","Sales","Revenue","Rate","Commission"].map(h => <TH key={h} right={["Sales","Revenue","Rate","Commission"].includes(h)}>{h}</TH>)}</tr></thead>
            <tbody>
              {commissionData.map(d => (
                <tr key={d.name} style={{ borderBottom: "1px solid var(--line)" }} {...hoverRow}>
                  <TD bold>{d.name}</TD><TD right mono>{d.count}</TD><TD right mono>{fmt(d.revenue)}</TD>
                  <TD right mono>{d.rate}%</TD><TD right mono bold color="#2DD4A8">{fmt(d.payout)}</TD>
                </tr>
              ))}
              {commissionData.length > 1 && (
                <tr style={{ borderTop: "2px solid var(--line)" }}>
                  <TD bold style={{ fontSize: 11, textTransform: "uppercase" }}>Total</TD>
                  <TD right mono bold>{commissionData.reduce((s,d)=>s+d.count,0)}</TD>
                  <TD right mono bold>{fmt(commissionData.reduce((s,d)=>s+d.revenue,0))}</TD><TD/>
                  <TD right mono bold color="#2DD4A8">{fmt(commissionData.reduce((s,d)=>s+d.payout,0))}</TD>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { authed, login, logout }        = useAuth();
  const { settings, save: saveSettings } = useSettings();
  const [tab, setTab]                    = useState("dashboard");
  const [dateRange, setDateRange]        = useState({ preset: "thisMonth", from: "", to: "" });
  const [settingsOpen, setSettingsOpen]  = useState(false);
  const data = useData();
  const { sales, expenses, salespeople, vendors, products, vendorPurchases, auditLogs, loading, error, reload } = data;
  const w = useWidth(); const mobile = w < 640; const tablet = w < 900;

  const bounds           = getDateBounds(dateRange.preset, dateRange.from, dateRange.to);
  const filteredSales    = useMemo(() => filterByDate(sales, bounds),    [sales, bounds]);
  const filteredExpenses = useMemo(() => filterByDate(expenses, bounds), [expenses, bounds]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "sales",     label: "Sales",     icon: "🛏"  },
    { id: "deposits",  label: "Deposits",  icon: "🏦"  },
    { id: "expenses",  label: "Expenses",  icon: "💸"  },
    { id: "inventory", label: "Inventory", icon: "📦"  },
    { id: "vendors",   label: "Vendors",   icon: "🏭"  },
    { id: "reports",   label: "Reports",   icon: "📈"  },
    { id: "logs",      label: "Logs",      icon: "📋"  },
  ];

  const owedCount    = filteredSales.filter(s => saleBalance(s) > 0 && !s.cancelledAt).length;
  const overdueCount = filteredSales.filter(s => isOverdue(s, settings.overdueDays)).length;

  if (!authed) return <LockScreen onLogin={login} />;

  return (
    <div style={{ "--bg": "#0F1118", "--card": "#181B25", "--line": "#252836", "--text": "#E8E9ED", "--dim": "#6B7084", "--accent": "#5B8DEF", "--accent-soft": "rgba(91,141,239,0.12)", "--font": "'DM Sans', system-ui, sans-serif", "--mono": "'JetBrains Mono', 'Consolas', monospace", fontFamily: "var(--font)", color: "var(--text)", background: "var(--bg)", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Nav */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: mobile ? "0 8px" : "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #5B8DEF, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>S</div>
          {!mobile && <div><div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{settings.storeName}</div><div style={{ fontSize: 8, color: "var(--dim)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>StorTrack</div></div>}
        </div>

        <div style={{ display: "flex", gap: 1, overflowX: "auto", flex: 1, justifyContent: "center" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? "var(--accent-soft)" : "transparent", color: tab === t.id ? "var(--accent)" : "var(--dim)", border: "none", padding: mobile ? "7px 7px" : "7px 11px", borderRadius: 8, fontSize: mobile ? 10 : 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3, position: "relative", flexShrink: 0 }}>
              <span style={{ fontSize: mobile ? 14 : 13 }}>{t.icon}</span>
              {!mobile && t.label}
              {t.id === "sales" && owedCount > 0 && <span style={{ position: "absolute", top: 1, right: 1, minWidth: 14, height: 14, borderRadius: "50%", background: overdueCount > 0 ? "#D45B5B" : "#F59E0B", color: "#000", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>{owedCount}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setSettingsOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--dim)", fontSize: 16, padding: "4px" }}>⚙</button>
          {!mobile && <button onClick={reload} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--dim)", fontSize: 16, padding: "4px" }}>↻</button>}
          <button onClick={logout} style={{ background: "none", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", color: "var(--dim)", fontSize: 11, fontWeight: 600, padding: "4px 8px", fontFamily: "inherit" }}>Lock</button>
        </div>
      </div>

      {/* Date Range Bar (not shown on inventory/vendors/logs/reports) */}
      {["dashboard","sales","deposits","expenses"].includes(tab) && (
        <div style={{ position: "sticky", top: 56, zIndex: 99 }}>
          <DateRangeBar range={dateRange} setRange={setDateRange} mobile={mobile} />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: mobile ? "16px 10px" : tablet ? "20px 16px" : "24px 24px", maxWidth: 1280, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ marginBottom: mobile ? 14 : 20 }}>
          <h1 style={{ margin: 0, fontSize: mobile ? 16 : 20, fontWeight: 700 }}>{tabs.find(t => t.id === tab)?.label}</h1>
        </div>

        {error && <div style={{ background: "#D45B5B22", border: "1px solid #D45B5B44", borderRadius: 10, padding: "14px 18px", marginBottom: 20, color: "#D45B5B", fontSize: 13 }}>⚠ {error} — <button onClick={reload} style={{ background: "none", border: "none", color: "#5B8DEF", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Retry</button></div>}

        {loading ? <Spinner /> : (
          <>
            {tab === "dashboard" && <DashboardTab sales={filteredSales} expenses={filteredExpenses} salespeople={salespeople} mobile={tablet} settings={settings} />}
            {tab === "sales"     && <SalesTab {...data} salespeople={salespeople} mobile={mobile} bounds={bounds} settings={settings} products={products} />}
            {tab === "deposits"  && <DepositsTab sales={sales} bounds={bounds} />}
            {tab === "expenses"  && <ExpensesTab expenses={expenses} addExpense={data.addExpense} deleteExpense={data.deleteExpense} bounds={bounds} />}
            {tab === "inventory" && <InventoryTab products={products} vendors={vendors} addProduct={data.addProduct} editProduct={data.editProduct} deleteProduct={data.deleteProduct} addVariant={data.addVariant} editVariant={data.editVariant} deleteVariant={data.deleteVariant} adjustInventory={data.adjustInventory} />}
            {tab === "vendors"   && <VendorsTab vendors={vendors} products={products} vendorPurchases={vendorPurchases} addVendor={data.addVendor} editVendor={data.editVendor} deleteVendor={data.deleteVendor} addVendorPurchase={data.addVendorPurchase} deleteVendorPurchase={data.deleteVendorPurchase} />}
            {tab === "reports"   && <ReportsTab sales={sales} expenses={expenses} salespeople={salespeople} settings={settings} />}
            {tab === "logs"      && <LogsTab auditLogs={auditLogs} />}
          </>
        )}
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} save={saveSettings} salespeople={salespeople} />
    </div>
  );
}
