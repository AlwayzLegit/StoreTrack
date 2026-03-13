import { useState } from "react";

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  const isMobile = window.innerWidth < 640;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: isMobile ? "20px 16px" : "28px 32px", width: "100%", maxWidth: isMobile ? "100%" : wide ? 720 : 520, maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 16 : 22 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--dim)", padding: "4px 8px", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, value, onChange, type = "text", options, placeholder, half, multiline, min, step }) {
  const base = { width: "100%", padding: "9px 13px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ marginBottom: 14, flex: half ? 1 : undefined }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, cursor: "pointer" }}>
            {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
          </select>
        : multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} min={min} step={step} style={base} />}
    </div>
  );
}

export function Btn({ children, onClick, v = "primary", s, disabled, type }) {
  const styles = {
    primary: { background: "var(--accent)", color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: "var(--dim)", border: "1px solid var(--line)" },
    danger:  { background: "transparent", color: "#D45B5B", border: "1px solid #D45B5B33" },
    success: { background: "transparent", color: "#2DD4A8", border: "1px solid #2DD4A833" },
  };
  return <button type={type || "button"} onClick={onClick} disabled={disabled} style={{ ...styles[v], padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: disabled ? 0.6 : 1, whiteSpace: "nowrap", ...s }}>{children}</button>;
}

export function TH({ children, right }) { return <th style={{ padding: "10px 14px", textAlign: right ? "right" : "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dim)", whiteSpace: "nowrap" }}>{children}</th>; }
export function TD({ children, right, mono, bold, color, style: sx }) { return <td style={{ padding: "10px 14px", textAlign: right ? "right" : "left", fontFamily: mono ? "var(--mono)" : "inherit", fontWeight: bold ? 700 : 400, color: color || "inherit", fontSize: 13, whiteSpace: "nowrap", ...sx }}>{children}</td>; }
export function Badge({ text, color, bg }) { return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>{text}</span>; }

export const hoverRow = {
  onMouseEnter: e => e.currentTarget.style.background = "rgba(91,141,239,0.06)",
  onMouseLeave: e => e.currentTarget.style.background = "transparent",
};

export function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "var(--card)", borderRadius: 12, padding: "14px 16px", borderLeft: `4px solid ${accent || "var(--accent)"}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dim)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Bar({ value, max, color }) {
  return (
    <div style={{ width: "100%", height: 7, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <div style={{ width: 32, height: 32, border: "3px solid var(--line)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Reason dialog — shown before destructive actions
export function ReasonModal({ open, onClose, onConfirm, title, placeholder, confirmLabel = "Confirm", v = "danger" }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  if (!open) return null;
  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    await onConfirm(reason.trim());
    setReason("");
    setSaving(false);
  };
  return (
    <Modal open={open} onClose={() => { setReason(""); onClose(); }} title={title || "Provide a reason"}>
      <p style={{ fontSize: 13, color: "var(--dim)", marginTop: 0, marginBottom: 16 }}>A reason is required before proceeding. This will be saved to the audit log.</p>
      <Field label="Reason *" value={reason} onChange={setReason} placeholder={placeholder || "Enter reason…"} multiline />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn v="ghost" onClick={() => { setReason(""); onClose(); }}>Cancel</Btn>
        <Btn v={v} onClick={handleConfirm} disabled={!reason.trim() || saving}>{saving ? "…" : confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

// Line item builder for sales / vendor purchases
export function LineItemBuilder({ items, setItems, catalog, catalogLabel = "Product" }) {
  const blankItem = () => ({ _id: Date.now(), variantId: null, description: "", qty: 1, price: 0, cost: 0, isCustom: false });

  const update = (id, field, val) => setItems(prev => prev.map(i => i._id === id ? { ...i, [field]: val } : i));

  const pickVariant = (id, variantId) => {
    if (!variantId) { update(id, "variantId", null); update(id, "isCustom", true); return; }
    const variant = catalog.find(v => v.id === variantId);
    if (variant) {
      update(id, "variantId", variantId);
      update(id, "description", `${variant.productName} — ${variant.size}`);
      update(id, "price", variant.retailPrice);
      update(id, "cost", variant.cost);
      update(id, "isCustom", false);
    }
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Line Items</label>
      {items.map((item, idx) => (
        <div key={item._id} style={{ background: "var(--card)", borderRadius: 10, padding: "12px 14px", marginBottom: 10, border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--dim)", fontWeight: 700, minWidth: 20 }}>#{idx + 1}</span>
            <select
              value={item.variantId || "custom"}
              onChange={e => pickVariant(item._id, e.target.value === "custom" ? null : e.target.value)}
              style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none" }}>
              <option value="custom">✏ Free text (not in catalog)</option>
              {catalog.map(v => <option key={v.id} value={v.id}>{v.productName} — {v.size} (${v.retailPrice})</option>)}
            </select>
            <button onClick={() => setItems(prev => prev.filter(i => i._id !== item._id))} style={{ background: "none", border: "none", color: "#D45B5B", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 3 }}>
              <input value={item.description} onChange={e => update(item._id, "description", e.target.value)} placeholder="Description" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" value={item.qty} onChange={e => update(item._id, "qty", Math.max(1, parseInt(e.target.value) || 1))} placeholder="Qty" min="1" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" value={item.price} onChange={e => update(item._id, "price", parseFloat(e.target.value) || 0)} placeholder="Price" step="0.01" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" value={item.cost} onChange={e => update(item._id, "cost", parseFloat(e.target.value) || 0)} placeholder="Cost" step="0.01" style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 5, textAlign: "right" }}>
            Subtotal: <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>${(item.qty * item.price).toFixed(2)}</span>
          </div>
        </div>
      ))}
      <button onClick={() => setItems(prev => [...prev, blankItem()])}
        style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px dashed var(--line)", background: "transparent", color: "var(--dim)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}>
        + Add Item
      </button>
      {items.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, fontSize: 13, fontFamily: "var(--mono)", fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
          <span>Total: <span style={{ color: "#2DD4A8" }}>${items.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}</span></span>
          <span>Cost: <span style={{ color: "#D45B5B" }}>${items.reduce((s, i) => s + i.qty * i.cost, 0).toFixed(2)}</span></span>
        </div>
      )}
    </div>
  );
}
