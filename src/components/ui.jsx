import { useState, useEffect } from "react";

// ─── Global styles injected once ──────────────────────────────────────────────
let _stylesInjected = false;
function injectGlobalStyles() {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--dim); }
    ::selection { background: rgba(91,141,239,0.3); }
    input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
    .st-btn-primary:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(91,141,239,0.35); }
    .st-btn-ghost:hover:not(:disabled)   { border-color: var(--accent); color: var(--text); }
    .st-btn-danger:hover:not(:disabled)  { background: rgba(212,91,91,0.12); }
    .st-btn-success:hover:not(:disabled) { background: rgba(45,212,168,0.12); }
    .st-btn { transition: all 0.15s ease; }
    .st-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .st-card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .st-field input:focus, .st-field select:focus, .st-field textarea:focus {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 3px rgba(91,141,239,0.15);
    }
    .st-row-hover:hover { background: rgba(91,141,239,0.05) !important; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(s);
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide }) {
  injectGlobalStyles();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { if (open) setTimeout(() => setMounted(true), 10); else setMounted(false); }, [open]);
  if (!open) return null;
  const isMobile = window.innerWidth < 640;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: isMobile ? "20px 20px 0 0" : 20, padding: isMobile ? "24px 18px 32px" : "32px 36px", width: "100%", maxWidth: isMobile ? "100%" : wide ? 740 : 520, maxHeight: isMobile ? "92vh" : "88vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", animation: mounted ? (isMobile ? "slideUp 0.25s ease" : "fadeIn 0.2s ease") : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 20 : 26 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 16, cursor: "pointer", color: "var(--dim)", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, transition: "all 0.15s" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, value, onChange, type = "text", options, placeholder, half, multiline, min, step }) {
  injectGlobalStyles();
  const base = { width: "100%", padding: "10px 13px", borderRadius: 9, border: "1.5px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" };
  return (
    <div className="st-field" style={{ marginBottom: 16, flex: half ? 1 : undefined, minWidth: 0 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7084' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}>
            {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
          </select>
        : multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} step={step} style={base} />}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, v = "primary", s, disabled, type }) {
  injectGlobalStyles();
  const styles = {
    primary: { background: "var(--accent)", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(91,141,239,0.25)" },
    ghost:   { background: "transparent", color: "var(--dim)", border: "1.5px solid var(--line)" },
    danger:  { background: "transparent", color: "#E05555", border: "1.5px solid rgba(224,85,85,0.25)" },
    success: { background: "transparent", color: "#22D3A5", border: "1.5px solid rgba(34,211,165,0.25)" },
  };
  return (
    <button type={type || "button"} onClick={onClick} disabled={disabled} className={`st-btn st-btn-${v}`}
      style={{ ...styles[v], padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6, ...s }}>
      {children}
    </button>
  );
}

// ─── Table primitives ─────────────────────────────────────────────────────────
export function TH({ children, right }) {
  return <th style={{ padding: "11px 16px", textAlign: right ? "right" : "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dim)", whiteSpace: "nowrap", borderBottom: "1px solid var(--line)" }}>{children}</th>;
}
export function TD({ children, right, mono, bold, color, style: sx }) {
  return <td style={{ padding: "11px 16px", textAlign: right ? "right" : "left", fontFamily: mono ? "var(--mono)" : "inherit", fontWeight: bold ? 700 : 400, color: color || "inherit", fontSize: 13, borderBottom: "1px solid var(--line)", ...sx }}>{children}</td>;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ text, color, bg }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: bg || "rgba(91,141,239,0.12)", color: color || "var(--accent)", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
      {text}
    </span>
  );
}

// ─── Row hover ────────────────────────────────────────────────────────────────
export const hoverRow = { className: "st-row-hover" };

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent, icon }) {
  injectGlobalStyles();
  return (
    <div className="st-card-hover" style={{ background: "var(--card)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--line)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent || "var(--accent)", borderRadius: "14px 14px 0 0" }} />
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--dim)", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--mono)", letterSpacing: "-0.02em", color: accent || "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─── Bar ──────────────────────────────────────────────────────────────────────
export function Bar({ value, max, color }) {
  return (
    <div style={{ width: "100%", height: 6, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid var(--line)", borderTop: `3px solid var(--accent)`, borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
      <div style={{ fontSize: 12, color: "var(--dim)", fontWeight: 500 }}>Loading…</div>
    </div>
  );
}

// ─── Reason Modal ─────────────────────────────────────────────────────────────
export function ReasonModal({ open, onClose, onConfirm, title, placeholder, confirmLabel = "Confirm", v = "danger" }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!open) { setReason(""); setSaving(false); } }, [open]);
  if (!open) return null;
  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    await onConfirm(reason.trim());
    setSaving(false);
  };
  return (
    <Modal open={open} onClose={() => { setReason(""); onClose(); }} title={title || "Provide a reason"}>
      <div style={{ background: "var(--bg)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start", border: "1px solid var(--line)" }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <p style={{ fontSize: 13, color: "var(--dim)", margin: 0, lineHeight: 1.6 }}>A reason is required before proceeding. This will be saved to the audit log and cannot be undone.</p>
      </div>
      <Field label="Reason *" value={reason} onChange={setReason} placeholder={placeholder || "Enter reason…"} multiline />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn v="ghost" onClick={() => { setReason(""); onClose(); }}>Cancel</Btn>
        <Btn v={v} onClick={handleConfirm} disabled={!reason.trim() || saving}>{saving ? "Processing…" : confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

// ─── Line Item Builder ────────────────────────────────────────────────────────
export function LineItemBuilder({ items, setItems, catalog, catalogLabel = "Product", vendors = [] }) {
  injectGlobalStyles();
  const blankItem = () => ({ _id: Date.now(), variantId: null, vendorId: null, description: "", qty: 1, price: 0, cost: 0, isCustom: false });
  const update = (id, field, val) => setItems(prev => prev.map(i => i._id === id ? { ...i, [field]: val } : i));

  const pickVariant = (id, variantId) => {
    if (!variantId) { update(id, "variantId", null); update(id, "isCustom", true); return; }
    const variant = catalog.find(v => v.id === variantId);
    if (variant) {
      setItems(prev => prev.map(i => i._id === id ? { ...i, variantId, description: `${variant.productName} — ${variant.size}`, price: variant.retailPrice, cost: variant.cost, isCustom: false } : i));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Line Items</label>
        {items.length > 0 && (
          <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--dim)" }}>
            Total: <span style={{ color: "#22D3A5", fontWeight: 700 }}>${items.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}</span>
          </div>
        )}
      </div>
      {items.map((item, idx) => (
        <div key={item._id} style={{ background: "var(--bg)", borderRadius: 12, padding: "14px", marginBottom: 10, border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, minWidth: 22, height: 22, borderRadius: 6, background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center" }}>{idx + 1}</span>
            <select value={item.variantId || "custom"} onChange={e => pickVariant(item._id, e.target.value === "custom" ? null : e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid var(--line)", background: "var(--card)", color: item.variantId ? "var(--text)" : "var(--dim)", fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer", transition: "border-color 0.15s" }}>
              <option value="custom">✏ Free text (not in catalog)</option>
              {catalog.map(v => <option key={v.id} value={v.id}>{v.productName} — {v.size} · ${v.retailPrice} · {v.quantityOnHand} in stock</option>)}
            </select>
            <button onClick={() => setItems(prev => prev.filter(i => i._id !== item._id))} style={{ background: "none", border: "none", color: "#E05555", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1, opacity: 0.7, transition: "opacity 0.15s" }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", gap: 8 }}>
            <input value={item.description} onChange={e => update(item._id, "description", e.target.value)} placeholder="Description"
              style={{ padding: "8px 11px", borderRadius: 8, border: "1.5px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s" }} />
            <input type="number" value={item.qty} onChange={e => update(item._id, "qty", Math.max(1, parseInt(e.target.value) || 1))} placeholder="Qty" min="1"
              style={{ padding: "8px 11px", borderRadius: 8, border: "1.5px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s", textAlign: "center" }} />
            <input type="number" value={item.price} onChange={e => update(item._id, "price", parseFloat(e.target.value) || 0)} placeholder="Price" step="0.01"
              style={{ padding: "8px 11px", borderRadius: 8, border: "1.5px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s" }} />
            <input type="number" value={item.cost} onChange={e => update(item._id, "cost", parseFloat(e.target.value) || 0)} placeholder="Cost" step="0.01"
              style={{ padding: "8px 11px", borderRadius: 8, border: "1.5px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            {item.isCustom && vendors.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--dim)", fontWeight: 600 }}>Vendor:</span>
                <select value={item.vendorId || ""} onChange={e => update(item._id, "vendorId", e.target.value || null)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "1.5px solid var(--line)", background: "var(--card)", color: item.vendorId ? "var(--text)" : "var(--dim)", fontSize: 11, fontFamily: "inherit", outline: "none" }}>
                  <option value="">— No vendor —</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            ) : <div />}
            <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)" }}>
              Subtotal: <span style={{ color: "#22D3A5", fontWeight: 700 }}>${(item.qty * item.price).toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => setItems(prev => [...prev, blankItem()])}
        style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1.5px dashed var(--line)", background: "transparent", color: "var(--dim)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--dim)"; }}>
        + Add Item
      </button>
    </div>
  );
}
