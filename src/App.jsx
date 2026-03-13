import { useState, useMemo, useEffect } from "react";

function useWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const PAYMENT_TYPES = ["Visa/MC","AMEX","Cash","Finance","Check","COD"];
const EXPENSE_CATS = [
  { id: "vendors", label: "Vendors / Inventory", color: "#E8853D" },
  { id: "utilities", label: "Utilities", color: "#5B8DEF" },
  { id: "ccfees", label: "Credit Card Fees", color: "#D45B5B" },
  { id: "advertising", label: "Advertising", color: "#8B5CF6" },
  { id: "accounting", label: "Accounting / Payroll", color: "#2DD4A8" },
  { id: "employees", label: "Employee Pay", color: "#F59E0B" },
  { id: "misc", label: "Miscellaneous", color: "#94A3B8" },
];

const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => (Number(n || 0) * 100).toFixed(1) + "%";

const sampleSales = [
  { id: 1, date: "2026-03-01", customer: "Maria Santos", phone: "310-555-0101", items: "Queen Set - Avery PT, CoolPro Pillow", address: "1221 Selby Ave Los Angeles CA 90024", price: 1399, cost: 636, salesperson: "Ronnie", deliveryDate: "2026-03-04", deliveryTime: "2-5pm", delivered: true,
    payments: [
      { id: 101, date: "2026-03-01", amount: 1399, method: "Visa/MC", note: "Paid in full" }
    ]},
  { id: 2, date: "2026-03-01", customer: "Jake Morrison", phone: "310-555-0202", items: "Full Matt - Bristol FM, Memory Pillow", address: "2935 Westwood Blvd Los Angeles CA 90064", price: 733, cost: 275, salesperson: "David", deliveryDate: "2026-03-05", deliveryTime: "11-2pm", delivered: true,
    payments: [
      { id: 102, date: "2026-03-01", amount: 400, method: "AMEX", note: "Initial deposit" },
      { id: 103, date: "2026-03-04", amount: 333, method: "AMEX", note: "Balance paid on delivery" }
    ]},
  { id: 3, date: "2026-03-02", customer: "Linda Park", phone: "424-555-0303", items: "King Set - Christelle PS, Frame, 2x MicroGel", address: "10316 Bannockburn Dr Los Angeles CA 90064", price: 2199, cost: 980, salesperson: "Ronnie", deliveryDate: "2026-03-08", deliveryTime: "1-4pm", delivered: false,
    payments: [
      { id: 104, date: "2026-03-02", amount: 800, method: "Cash", note: "Deposit" },
    ]},
  { id: 4, date: "2026-03-02", customer: "Tom Briggs", phone: "818-555-0404", items: "Twin Set - Ambassador PT, Frame/Glides", address: "808 Bien Veneda Ave Pacific Palisades CA 90272", price: 459, cost: 184, salesperson: "Sako", deliveryDate: "2026-03-04", deliveryTime: "2-5pm", delivered: true,
    payments: [
      { id: 105, date: "2026-03-02", amount: 459, method: "Finance", note: "Financed in full" }
    ]},
  { id: 5, date: "2026-03-03", customer: "Nadia Youssef", phone: "310-555-0505", items: "Queen Matt - Cashmere BT, CoolPro", address: "3780 Ocean View Ave Los Angeles CA 90066", price: 1100, cost: 495, salesperson: "David", deliveryDate: "2026-03-07", deliveryTime: "10-1pm", delivered: false,
    payments: [
      { id: 106, date: "2026-03-03", amount: 500, method: "Visa/MC", note: "Deposit" },
    ]},
  { id: 6, date: "2026-03-04", customer: "Chris Albright", phone: "310-555-0606", items: "Cal King Set - Moonlit Night, Frame/Glides, 2x MicroGel", address: "3612 Barham Blvd Los Angeles CA 90068", price: 1650, cost: 720, salesperson: "Ronnie", deliveryDate: "2026-03-10", deliveryTime: "2-5pm", delivered: false,
    payments: [
      { id: 107, date: "2026-03-04", amount: 650, method: "AMEX", note: "Deposit" },
      { id: 108, date: "2026-03-09", amount: 500, method: "Cash", note: "Partial payment" },
    ]},
  { id: 7, date: "2026-03-05", customer: "Emily Chen", phone: "424-555-0707", items: "Full Set - Ambassador PS, Frame", address: "1930 Fairburn Ave Los Angeles CA 90025", price: 599, cost: 288, salesperson: "Sako", deliveryDate: "2026-03-06", deliveryTime: "11-2pm", delivered: true,
    payments: [
      { id: 109, date: "2026-03-05", amount: 599, method: "Visa/MC", note: "Paid in full" }
    ]},
];

const sampleExpenses = [
  { id: 1, date: "2026-03-01", category: "vendors", vendor: "SOP Mattress", amount: 4250, note: "Monthly restock" },
  { id: 2, date: "2026-03-01", category: "vendors", vendor: "Leggit/Holly", amount: 1800, note: "Frames order" },
  { id: 3, date: "2026-03-03", category: "utilities", vendor: "LADWP", amount: 285, note: "Electric" },
  { id: 4, date: "2026-03-03", category: "utilities", vendor: "Spectrum", amount: 89, note: "Internet" },
  { id: 5, date: "2026-03-05", category: "ccfees", vendor: "AMEX Processing", amount: 142, note: "Monthly fee" },
  { id: 6, date: "2026-03-05", category: "advertising", vendor: "Yelp", amount: 350, note: "Monthly ad" },
  { id: 7, date: "2026-03-01", category: "employees", vendor: "Ronnie", amount: 2800, note: "Bi-weekly" },
  { id: 8, date: "2026-03-01", category: "employees", vendor: "David", amount: 2400, note: "Bi-weekly" },
  { id: 9, date: "2026-03-01", category: "employees", vendor: "Sako", amount: 2200, note: "Bi-weekly" },
  { id: 10, date: "2026-03-03", category: "accounting", vendor: "Dorian Tax", amount: 500, note: "Monthly" },
];

const initialSalespeople = ["Ronnie", "David", "Sako"];

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
    <div onClick={onClose} onKeyDown={e => e.key === "Escape" && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: isMobile ? "20px 16px" : "28px 32px", width: "100%", maxWidth: isMobile ? "100%" : wide ? 640 : 520, maxHeight: isMobile ? "92vh" : "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 16 : 22 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--dim)", padding: "4px 8px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", options, placeholder, half }) {
  const base = { width: "100%", padding: "9px 13px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ marginBottom: 14, flex: half ? 1 : undefined }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {options ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: "pointer" }}>{options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}</select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />}
    </div>
  );
}

function Btn({ children, onClick, v = "primary", s }) {
  const styles = { primary: { background: "var(--accent)", color: "#fff", border: "none" }, ghost: { background: "transparent", color: "var(--dim)", border: "1px solid var(--line)" }, danger: { background: "transparent", color: "#D45B5B", border: "1px solid #D45B5B33" } };
  return <button onClick={onClick} style={{ ...styles[v], padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", ...s }}>{children}</button>;
}

function TH({ children, right }) { return <th style={{ padding: "10px 14px", textAlign: right ? "right" : "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dim)" }}>{children}</th>; }
function TD({ children, right, mono, bold, color, style: sx }) { return <td style={{ padding: "10px 14px", textAlign: right ? "right" : "left", fontFamily: mono ? "var(--mono)" : "inherit", fontWeight: bold ? 700 : 400, color: color || "inherit", fontSize: 13, whiteSpace: "nowrap", ...sx }}>{children}</td>; }

function Badge({ text, color, bg }) { return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color }}>{text}</span>; }

const hoverRow = {
  onMouseEnter: e => e.currentTarget.style.background = "rgba(91,141,239,0.06)",
  onMouseLeave: e => e.currentTarget.style.background = "transparent",
};

function saleBalance(sale) {
  const paid = sale.payments.reduce((s, p) => s + p.amount, 0);
  return sale.price - paid;
}

function buildDeposits(sales) {
  const byDate = {};
  sales.forEach(sale => {
    sale.payments.forEach(p => {
      if (!byDate[p.date]) byDate[p.date] = { visamc: 0, amex: 0, cash: 0, finance: 0, check: 0, cod: 0 };
      const key = { "Visa/MC": "visamc", "AMEX": "amex", "Cash": "cash", "Finance": "finance", "Check": "check", "COD": "cod" }[p.method] || "cash";
      byDate[p.date][key] += p.amount;
    });
  });
  return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, vals], i) => ({ id: i, date, ...vals }));
}

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
        <StatCard label="Cash Flow" value={fmt(cashFlow)} sub="Collected − Expenses" accent={cashFlow >= 0 ? "#2DD4A8" : "#D45B5B"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "var(--card)", borderRadius: 12, padding: 22 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700 }}>Salesperson Performance</h3>
            {spData.map((sp, i) => (
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
                <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 3 }}>{sp.count} sales · {fmt(sp.profit)} profit</div>
              </div>
            ))}
          </div>

          {owedSales.length > 0 && (
            <div style={{ background: "var(--card)", borderRadius: 12, padding: 22, borderLeft: "4px solid #F59E0B" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#F59E0B" }}>⚠</span> Outstanding Balances
              </h3>
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
                    <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 3 }}>
                      Total: {fmt(sale.price)} · Paid: {fmt(sale.price - bal)} · Sale date: {sale.date}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: "var(--card)", borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Expense Breakdown</h3>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--dim)", marginBottom: 14 }}>Total: {fmt(totalExpenses)}</div>
          {expByCat.map(cat => (
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

function SalesTab({ sales, setSales, salespeople, setSalespeople, mobile }) {
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [spModal, setSpModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [newSp, setNewSp] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ date: today(), customer: "", phone: "", items: "", address: "", price: "", cost: "", salesperson: salespeople[0] || "", deliveryDate: "", deliveryTime: "", initPayment: "", initMethod: "Visa/MC", initNote: "Initial deposit" });
  const [payForm, setPayForm] = useState({ date: today(), amount: "", method: "Visa/MC", note: "" });
  const [filter, setFilter] = useState("all");

  const addSale = () => {
    if (!form.customer || !form.price) return;
    const initPay = Number(form.initPayment || 0);
    const payments = initPay > 0 ? [{ id: Date.now() + 1, date: form.date, amount: initPay, method: form.initMethod, note: form.initNote || "Initial deposit" }] : [];
    setSales(prev => [...prev, { id: Date.now(), date: form.date, customer: form.customer, phone: form.phone, items: form.items, address: form.address, price: Number(form.price), cost: Number(form.cost || 0), salesperson: form.salesperson, deliveryDate: form.deliveryDate, deliveryTime: form.deliveryTime, delivered: false, payments }]);
    setForm({ date: today(), customer: "", phone: "", items: "", address: "", price: "", cost: "", salesperson: salespeople[0] || "", deliveryDate: "", deliveryTime: "", initPayment: "", initMethod: "Visa/MC", initNote: "Initial deposit" });
    setModal(false);
  };

  const recordPayment = () => {
    if (!payForm.amount || !payModal) return;
    setSales(prev => prev.map(s => s.id === payModal ? { ...s, payments: [...s.payments, { id: Date.now(), date: payForm.date, amount: Number(payForm.amount), method: payForm.method, note: payForm.note }] } : s));
    setPayForm({ date: today(), amount: "", method: "Visa/MC", note: "" });
    setPayModal(null);
  };

  const toggleDelivered = (id) => setSales(prev => prev.map(s => s.id === id ? { ...s, delivered: !s.delivered } : s));

  const filtered = useMemo(() => {
    let list = [...sales];
    if (filter === "owed") list = list.filter(s => saleBalance(s) > 0);
    if (filter === "paid") list = list.filter(s => saleBalance(s) <= 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.customer.toLowerCase().includes(q) || s.items.toLowerCase().includes(q) || s.salesperson.toLowerCase().includes(q));
    }
    return list.reverse();
  }, [sales, filter, search]);

  const owedCount = sales.filter(s => saleBalance(s) > 0).length;
  const detailSale = detailModal ? sales.find(s => s.id === detailModal) : null;
  const paySale = payModal ? sales.find(s => s.id === payModal) : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <Btn onClick={() => setModal(true)}>+ New Sale</Btn>
        <Btn onClick={() => setSpModal(true)} v="ghost">+ Salesperson</Btn>
        <input
          value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          style={{ padding: "9px 13px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", flex: mobile ? "1 1 100%" : "0 0 250px", minWidth: 0 }}
        />
        <div style={{ marginLeft: mobile ? 0 : "auto", display: "flex", gap: 4, background: "var(--card)", borderRadius: 8, padding: 3, flex: mobile ? "1 1 100%" : undefined }}>
          {[["all", "All"], ["owed", `Owed (${owedCount})`], ["paid", "Paid"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: filter === k ? "var(--accent)" : "transparent", color: filter === k ? "#fff" : "var(--dim)", flex: mobile ? 1 : undefined,
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
            <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>
              {["Date","Customer","Salesperson","Total","Paid","Balance","Margin","Delivery",""].map(h => <TH key={h} right={["Total","Paid","Balance","Margin"].includes(h)}>{h}</TH>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>
                  {search ? "No sales match your search." : filter === "paid" ? "No paid sales yet." : filter === "owed" ? "No outstanding balances!" : "No sales recorded. Click \"+ New Sale\" to get started."}
                </td></tr>
              )}
              {filtered.map(s => {
                const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
                const bal = s.price - paid;
                const profit = s.price - s.cost;
                const margin = s.price > 0 ? profit / s.price : 0;
                return (
                  <tr key={s.id} onClick={() => setDetailModal(s.id)} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer", transition: "background 0.15s" }} {...hoverRow}>
                    <TD mono>{s.date}</TD>
                    <TD bold>{s.customer}</TD>
                    <TD><Badge text={s.salesperson} color="var(--accent)" bg="var(--accent-soft)" /></TD>
                    <TD right mono bold>{fmt(s.price)}</TD>
                    <TD right mono color="#2DD4A8">{fmt(paid)}</TD>
                    <TD right mono bold color={bal > 0 ? "#F59E0B" : "#2DD4A8"}>{bal > 0 ? fmt(bal) : "PAID"}</TD>
                    <TD right mono>{pct(margin)}</TD>
                    <TD>
                      <Badge text={s.delivered ? "Delivered" : "Pending"} color={s.delivered ? "#2DD4A8" : "#F59E0B"} bg={s.delivered ? "rgba(45,212,168,0.12)" : "rgba(244,158,11,0.12)"} />
                    </TD>
                    <TD>
                      {bal > 0 && <Btn v="ghost" s={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); setPayModal(s.id); }}>Pay</Btn>}
                    </TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Sale" wide>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" half />
          <Field label="Customer *" value={form.customer} onChange={v => setForm(f => ({ ...f, customer: v }))} placeholder="Customer name" half />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="Phone number" half />
          <Field label="Salesperson" value={form.salesperson} onChange={v => setForm(f => ({ ...f, salesperson: v }))} options={salespeople} half />
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
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Initial Payment (optional)</div>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Amount" value={form.initPayment} onChange={v => setForm(f => ({ ...f, initPayment: v }))} type="number" placeholder="0.00" half />
            <Field label="Method" value={form.initMethod} onChange={v => setForm(f => ({ ...f, initMethod: v }))} options={PAYMENT_TYPES} half />
          </div>
          <Field label="Note" value={form.initNote} onChange={v => setForm(f => ({ ...f, initNote: v }))} placeholder="Payment note" />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={addSale}>Save Sale</Btn>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Record Payment">
        {paySale && (
          <div style={{ background: "var(--card)", borderRadius: 8, padding: 14, marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{paySale.customer}</div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>
              Balance due: <span style={{ color: "#F59E0B", fontWeight: 700, fontFamily: "var(--mono)" }}>{fmt(saleBalance(paySale))}</span>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Date" value={payForm.date} onChange={v => setPayForm(f => ({ ...f, date: v }))} type="date" half />
          <Field label="Amount *" value={payForm.amount} onChange={v => setPayForm(f => ({ ...f, amount: v }))} type="number" placeholder="0.00" half />
        </div>
        <Field label="Method" value={payForm.method} onChange={v => setPayForm(f => ({ ...f, method: v }))} options={PAYMENT_TYPES} />
        <Field label="Note" value={payForm.note} onChange={v => setPayForm(f => ({ ...f, note: v }))} placeholder="Payment note" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setPayModal(null)}>Cancel</Btn>
          <Btn onClick={recordPayment}>Record Payment</Btn>
        </div>
      </Modal>

      {/* Add Salesperson Modal */}
      <Modal open={spModal} onClose={() => setSpModal(false)} title="Add Salesperson">
        <Field label="Name" value={newSp} onChange={setNewSp} placeholder="Salesperson name" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setSpModal(false)}>Cancel</Btn>
          <Btn onClick={() => {
            if (!newSp.trim() || salespeople.includes(newSp.trim())) return;
            setSalespeople(prev => [...prev, newSp.trim()]);
            setNewSp("");
            setSpModal(false);
          }}>Add</Btn>
        </div>
      </Modal>

      {/* Sale Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Sale Details" wide>
        {detailSale && (() => {
          const paid = detailSale.payments.reduce((s, p) => s + p.amount, 0);
          const bal = detailSale.price - paid;
          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 640 ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Customer</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{detailSale.customer}</div>
                  {detailSale.phone && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{detailSale.phone}</div>}
                  {detailSale.address && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{detailSale.address}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Sale Info</div>
                  <div style={{ fontSize: 12, color: "var(--dim)" }}>Date: {detailSale.date} · Salesperson: {detailSale.salesperson}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>Items: {detailSale.items}</div>
                  {detailSale.deliveryDate && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>Delivery: {detailSale.deliveryDate} {detailSale.deliveryTime}</div>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 640 ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                <div style={{ background: "var(--card)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase" }}>Total</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)" }}>{fmt(detailSale.price)}</div>
                </div>
                <div style={{ background: "var(--card)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase" }}>Paid</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)", color: "#2DD4A8" }}>{fmt(paid)}</div>
                </div>
                <div style={{ background: "var(--card)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase" }}>Balance</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)", color: bal > 0 ? "#F59E0B" : "#2DD4A8" }}>{bal > 0 ? fmt(bal) : "PAID"}</div>
                </div>
                <div style={{ background: "var(--card)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase" }}>Margin</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--mono)" }}>{pct(detailSale.price > 0 ? (detailSale.price - detailSale.cost) / detailSale.price : 0)}</div>
                </div>
              </div>

              {detailSale.payments.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Payment History</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>
                      {["Date","Amount","Method","Note"].map(h => <TH key={h} right={h === "Amount"}>{h}</TH>)}
                    </tr></thead>
                    <tbody>
                      {detailSale.payments.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <TD mono>{p.date}</TD>
                          <TD right mono bold color="#2DD4A8">{fmt(p.amount)}</TD>
                          <TD>{p.method}</TD>
                          <TD color="var(--dim)">{p.note}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn v={detailSale.delivered ? "danger" : "ghost"} onClick={() => toggleDelivered(detailSale.id)}>
                  {detailSale.delivered ? "Mark Undelivered" : "Mark Delivered"}
                </Btn>
                {bal > 0 && <Btn onClick={() => { setDetailModal(null); setPayModal(detailSale.id); }}>Record Payment</Btn>}
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}

function DepositsTab({ sales }) {
  const deposits = useMemo(() => buildDeposits(sales), [sales]);
  return (
    <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, padding: "18px 22px 0" }}>Daily Deposits</h3>
      <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
        <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>
          {["Date","Visa/MC","AMEX","Cash","Finance","Check","COD","Total"].map(h => <TH key={h} right={h !== "Date"}>{h}</TH>)}
        </tr></thead>
        <tbody>
          {deposits.length === 0 && (
            <tr><td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>
              No deposits yet. Deposits are generated automatically from sale payments.
            </td></tr>
          )}
          {[...deposits].reverse().map(d => {
            const total = d.visamc + d.amex + d.cash + d.finance + d.check + d.cod;
            return (
              <tr key={d.date} style={{ borderBottom: "1px solid var(--line)", transition: "background 0.15s" }} {...hoverRow}>
                <TD mono>{d.date}</TD>
                {[d.visamc, d.amex, d.cash, d.finance, d.check, d.cod].map((v, i) => (
                  <TD key={i} right mono>{fmt(v)}</TD>
                ))}
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

function ExpensesTab({ expenses, setExpenses }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: today(), category: EXPENSE_CATS[0].id, vendor: "", amount: "", note: "" });
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const catLookup = Object.fromEntries(EXPENSE_CATS.map(c => [c.id, c]));

  const addExpense = () => {
    if (!form.vendor || !form.amount) return;
    setExpenses(prev => [...prev, { id: Date.now(), date: form.date, category: form.category, vendor: form.vendor, amount: Number(form.amount), note: form.note }]);
    setForm({ date: today(), category: EXPENSE_CATS[0].id, vendor: "", amount: "", note: "" });
    setModal(false);
  };

  return (
    <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Expenses</h3>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>Total: {fmt(total)}</div>
        </div>
        <Btn onClick={() => setModal(true)}>+ New Expense</Btn>
      </div>
      <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
        <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>
          {["Date","Category","Vendor","Amount","Note"].map(h => <TH key={h} right={h === "Amount"}>{h}</TH>)}
        </tr></thead>
        <tbody>
          {expenses.length === 0 && (
            <tr><td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>
              No expenses recorded. Click "+ New Expense" to add one.
            </td></tr>
          )}
          {[...expenses].reverse().map(e => {
            const cat = catLookup[e.category];
            return (
              <tr key={e.id} style={{ borderBottom: "1px solid var(--line)", transition: "background 0.15s" }} {...hoverRow}>
                <TD mono>{e.date}</TD>
                <TD>{cat?.label || e.category}</TD>
                <TD bold>{e.vendor}</TD>
                <TD right mono bold color="#D45B5B">{fmt(e.amount)}</TD>
                <TD color="var(--dim)">{e.note}</TD>
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
          <Btn onClick={addExpense}>Save Expense</Btn>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [sales, setSales] = useState(sampleSales);
  const [expenses, setExpenses] = useState(sampleExpenses);
  const [salespeople, setSalespeople] = useState(initialSalespeople);
  const w = useWidth();
  const mobile = w < 640;
  const tablet = w < 900;

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "◩" },
    { id: "sales", label: "Sales", icon: "⊕" },
    { id: "deposits", label: "Deposits", icon: "↓" },
    { id: "expenses", label: "Expenses", icon: "↑" },
  ];

  const owedCount = sales.filter(s => saleBalance(s) > 0).length;

  return (
    <div style={{
      "--bg": "#0F1118", "--card": "#181B25", "--line": "#252836", "--text": "#E8E9ED", "--dim": "#6B7084",
      "--accent": "#5B8DEF", "--accent-soft": "rgba(91,141,239,0.12)",
      "--font": "'DM Sans', system-ui, sans-serif", "--mono": "'JetBrains Mono', 'Consolas', monospace",
      fontFamily: "var(--font)", color: "var(--text)", background: "var(--bg)", minHeight: "100vh",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: mobile ? "0 12px" : "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #5B8DEF, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>S</div>
          {!mobile && <div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>StorTrack</div>
            <div style={{ fontSize: 8, color: "var(--dim)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Small Business Finance</div>
          </div>}
        </div>

        <div style={{ display: "flex", gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "var(--accent-soft)" : "transparent",
              color: tab === t.id ? "var(--accent)" : "var(--dim)",
              border: "none", padding: mobile ? "7px 10px" : "7px 14px", borderRadius: 8, fontSize: mobile ? 11 : 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 4, position: "relative",
            }}>
              <span style={{ fontSize: mobile ? 15 : 14 }}>{t.icon}</span>
              {!mobile && t.label}
              {mobile && tab === t.id && <span style={{ fontSize: 11 }}>{t.label}</span>}
              {t.id === "sales" && owedCount > 0 && <span style={{ position: "absolute", top: 1, right: mobile ? 0 : 3, width: 15, height: 15, borderRadius: "50%", background: "#F59E0B", color: "#000", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{owedCount}</span>}
            </button>
          ))}
        </div>

        {!mobile && <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)", flexShrink: 0 }}>March 2026</div>}
      </div>

      {/* Content */}
      <div style={{ padding: mobile ? "16px 12px" : tablet ? "20px 20px" : "24px 28px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ marginBottom: mobile ? 16 : 24 }}>
          <h1 style={{ margin: 0, fontSize: mobile ? 17 : 20, fontWeight: 700 }}>{tabs.find(t => t.id === tab)?.label}</h1>
          <p style={{ margin: "4px 0 0", fontSize: mobile ? 11 : 12, color: "var(--dim)" }}>
            {tab === "dashboard" && "Revenue, profit, outstanding balances, and expense overview."}
            {tab === "sales" && "Track sales, partial payments, and customer balances."}
            {tab === "deposits" && "Auto-generated from every payment received."}
            {tab === "expenses" && "All outgoing cash organized by category."}
          </p>
        </div>

        {tab === "dashboard" && <DashboardTab sales={sales} expenses={expenses} salespeople={salespeople} mobile={tablet} />}
        {tab === "sales" && <SalesTab sales={sales} setSales={setSales} salespeople={salespeople} setSalespeople={setSalespeople} mobile={mobile} />}
        {tab === "deposits" && <DepositsTab sales={sales} />}
        {tab === "expenses" && <ExpensesTab expenses={expenses} setExpenses={setExpenses} />}
      </div>
    </div>
  );
}
