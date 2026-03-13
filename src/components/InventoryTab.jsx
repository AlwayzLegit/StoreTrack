import { useState, useMemo } from "react";
import { Modal, Field, Btn, TH, TD, Badge, hoverRow, ReasonModal } from "./ui.jsx";
import { fmt } from "../utils.js";

function stockBadge(qty) {
  if (qty <= 0)  return <Badge text="Out of Stock" color="#E05555" bg="rgba(212,91,91,0.12)" />;
  if (qty <= 2)  return <Badge text="Low Stock"    color="#F0A429" bg="rgba(245,158,11,0.12)" />;
  return              <Badge text="In Stock"     color="#22D3A5" bg="rgba(45,212,168,0.12)" />;
}

function productStockBadge(variants) {
  if (!variants.length) return null;
  const outCount  = variants.filter(v => v.quantityOnHand <= 0).length;
  const lowCount  = variants.filter(v => v.quantityOnHand > 0 && v.quantityOnHand <= 2).length;
  if (outCount === variants.length) return <Badge text="Out of Stock" color="#E05555" bg="rgba(212,91,91,0.12)" />;
  if (outCount > 0 || lowCount > 0) return <Badge text="Low Stock"   color="#F0A429" bg="rgba(245,158,11,0.12)" />;
  return <Badge text="In Stock" color="#22D3A5" bg="rgba(45,212,168,0.12)" />;
}

function blankProduct(vendorId = "") { return { name: "", brand: "", vendorId, notes: "" }; }
function blankVariant() { return { _id: Date.now(), size: "", cost: "", retailPrice: "", qty: 0 }; }

export function InventoryTab({ products, vendors, addProduct, editProduct, deleteProduct, addVariant, editVariant, deleteVariant, adjustInventory }) {
  const [search, setSearch]             = useState("");
  const [addModal, setAddModal]         = useState(false);
  const [editModal, setEditModal]       = useState(null); // product
  const [varModal, setVarModal]         = useState(null); // product id → add variant
  const [editVarModal, setEditVarModal] = useState(null); // variant obj
  const [adjustModal, setAdjustModal]   = useState(null); // variant obj
  const [deleteModal, setDeleteModal]   = useState(null); // {type, id}
  const [form, setForm]                 = useState(blankProduct());
  const [editForm, setEditForm]         = useState(null);
  const [varForms, setVarForms]         = useState([blankVariant()]);
  const [varForm, setVarForm]           = useState({ size: "", cost: "", retailPrice: "", qty: 0 });
  const [editVarForm, setEditVarForm]   = useState(null);
  const [adjustQty, setAdjustQty]       = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [saving, setSaving]             = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);

  const vendorOptions = [{ value: "", label: "— No vendor —" }, ...vendors.map(v => ({ value: v.id, label: v.name }))];

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [products, search]);

  const lowStock = products.flatMap(p => p.variants.filter(v => v.quantityOnHand <= 2));

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await addProduct({ ...form, variants: varForms.filter(v => v.size).map(v => ({ size: v.size, cost: v.cost || 0, retailPrice: v.retailPrice || 0, qty: v.qty || 0 })) });
      setForm(blankProduct()); setVarForms([blankVariant()]); setAddModal(false);
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleEditProduct = async () => {
    if (!editForm?.name) return;
    setSaving(true);
    try { await editProduct(editModal, editForm); setEditModal(null); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleAddVariant = async () => {
    if (!varForm.size) return;
    setSaving(true);
    try { await addVariant(varModal, { size: varForm.size, cost: varForm.cost || 0, retailPrice: varForm.retailPrice || 0, qty: varForm.qty || 0 }); setVarModal(null); setVarForm({ size: "", cost: "", retailPrice: "", qty: 0 }); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleEditVariant = async () => {
    if (!editVarForm?.size) return;
    setSaving(true);
    try { await editVariant(editVarModal.id, editVarForm); setEditVarModal(null); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleAdjust = async () => {
    if (adjustQty === "" || !adjustReason.trim()) return;
    setSaving(true);
    try { await adjustInventory(adjustModal.id, parseInt(adjustQty), adjustReason); setAdjustModal(null); setAdjustQty(""); setAdjustReason(""); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  return (
    <div>
      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{ background: "#F0A42915", border: "1px solid #F0A42933", borderRadius: 10, padding: "12px 18px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F0A429", marginBottom: 6 }}>⚠ {lowStock.length} variant{lowStock.length !== 1 ? "s" : ""} low on stock (≤2 units)</div>
          <div style={{ fontSize: 12, color: "var(--dim)" }}>
            {lowStock.map(v => { const p = products.find(p => p.variants.some(vv => vv.id === v.id)); return `${p?.name} — ${v.size} (${v.quantityOnHand} left)`; }).join(" · ")}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <Btn onClick={() => { setForm(blankProduct()); setVarForms([blankVariant()]); setAddModal(true); }}>+ New Product</Btn>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
          style={{ padding: "9px 13px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", flex: "0 0 220px" }} />
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--dim)", fontFamily: "var(--mono)" }}>
          {products.length} products · {products.reduce((s, p) => s + p.variants.length, 0)} variants · {products.reduce((s, p) => s + p.variants.reduce((vs, v) => vs + v.quantityOnHand, 0), 0)} units on hand
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: "var(--card)", borderRadius: 12, padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>No products yet. Click "+ New Product" to add one.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(p => {
            const vendor = vendors.find(v => v.id === p.vendorId);
            const expanded = expandedProduct === p.id;
            const totalValue = p.variants.reduce((s, v) => s + v.quantityOnHand * v.cost, 0);
            const totalUnits = p.variants.reduce((s, v) => s + v.quantityOnHand, 0);
            return (
              <div key={p.id} style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
                <div onClick={() => setExpandedProduct(expanded ? null : p.id)}
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", cursor: "pointer" }} {...hoverRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2 }}>
                      {p.brand && <span style={{ marginRight: 10 }}>{p.brand}</span>}
                      {vendor && <span style={{ color: "var(--accent)" }}>{vendor.name}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontFamily: "var(--mono)", fontWeight: 600 }}>{totalUnits} units</div>
                      <div style={{ fontSize: 10, color: "var(--dim)" }}>{fmt(totalValue)} cost value</div>
                    </div>
                    {productStockBadge(p.variants)}
                    <Badge text={`${p.variants.length} size${p.variants.length !== 1 ? "s" : ""}`} color="var(--accent)" bg="var(--accent-soft)" />
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn v="ghost" s={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); setEditForm({ name: p.name, brand: p.brand, vendorId: p.vendorId || "", notes: p.notes }); setEditModal(p.id); }}>Edit</Btn>
                      <Btn v="danger" s={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); if (confirm(`Delete ${p.name} and all variants?`)) deleteProduct(p.id); }}>×</Btn>
                    </div>
                    <span style={{ color: "var(--dim)", fontSize: 16, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>▾</span>
                  </div>
                </div>

                {expanded && (
                  <div style={{ borderTop: "1px solid var(--line)", padding: "0 18px 14px" }}>
                    {p.notes && <div style={{ fontSize: 12, color: "var(--dim)", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>{p.notes}</div>}
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                      <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>
                        <TH>Size</TH><TH>Status</TH><TH right>Cost</TH><TH right>Retail</TH><TH right>Margin</TH><TH right>On Hand</TH><TH right>Value</TH><TH></TH>
                      </tr></thead>
                      <tbody>
                        {p.variants.map(v => (
                          <tr key={v.id} style={{ borderBottom: "1px solid var(--line)" }}>
                            <TD bold>{v.size}</TD>
                            <TD>{stockBadge(v.quantityOnHand)}</TD>
                            <TD right mono>{fmt(v.cost)}</TD>
                            <TD right mono>{fmt(v.retailPrice)}</TD>
                            <TD right mono>{v.retailPrice > 0 ? ((v.retailPrice - v.cost) / v.retailPrice * 100).toFixed(1) + "%" : "—"}</TD>
                            <TD right mono bold color={v.quantityOnHand <= 0 ? "#E05555" : v.quantityOnHand <= 2 ? "#F0A429" : "#22D3A5"}>{v.quantityOnHand}</TD>
                            <TD right mono>{fmt(v.quantityOnHand * v.cost)}</TD>
                            <TD style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                                <Btn v="ghost" s={{ padding: "3px 8px", fontSize: 10 }} onClick={() => { setAdjustModal(v); setAdjustQty(String(v.quantityOnHand)); }}>Adjust</Btn>
                                <Btn v="ghost" s={{ padding: "3px 8px", fontSize: 10 }} onClick={() => { setEditVarModal(v); setEditVarForm({ size: v.size, cost: String(v.cost), retailPrice: String(v.retailPrice), qty: v.quantityOnHand }); }}>Edit</Btn>
                                <Btn v="danger" s={{ padding: "3px 8px", fontSize: 10 }} onClick={() => { if (confirm("Delete this variant?")) deleteVariant(v.id); }}>×</Btn>
                              </div>
                            </TD>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: 10 }}>
                      <Btn v="ghost" s={{ fontSize: 11, padding: "5px 12px" }} onClick={() => { setVarModal(p.id); setVarForm({ size: "", cost: "", retailPrice: "", qty: 0 }); }}>+ Add Size/Variant</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="New Product" wide>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Product Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Bristol Mattress" half />
          <Field label="Brand" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} placeholder="e.g. Beautyrest" half />
        </div>
        <Field label="Vendor" value={form.vendorId} onChange={v => setForm(f => ({ ...f, vendorId: v }))} options={vendorOptions} />
        <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Internal notes…" multiline />
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 16, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--dim)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Sizes / Variants</div>
          {varForms.map((v, idx) => (
            <div key={v._id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}><Field label={idx === 0 ? "Size" : ""} value={v.size} onChange={val => setVarForms(prev => prev.map(vv => vv._id === v._id ? { ...vv, size: val } : vv))} placeholder="e.g. Queen" /></div>
              <div style={{ flex: 1 }}><Field label={idx === 0 ? "Cost" : ""} value={v.cost} onChange={val => setVarForms(prev => prev.map(vv => vv._id === v._id ? { ...vv, cost: val } : vv))} type="number" placeholder="0.00" /></div>
              <div style={{ flex: 1 }}><Field label={idx === 0 ? "Retail $" : ""} value={v.retailPrice} onChange={val => setVarForms(prev => prev.map(vv => vv._id === v._id ? { ...vv, retailPrice: val } : vv))} type="number" placeholder="0.00" /></div>
              <div style={{ flex: 1 }}><Field label={idx === 0 ? "Qty" : ""} value={v.qty} onChange={val => setVarForms(prev => prev.map(vv => vv._id === v._id ? { ...vv, qty: val } : vv))} type="number" placeholder="0" /></div>
              {varForms.length > 1 && <button onClick={() => setVarForms(prev => prev.filter(vv => vv._id !== v._id))} style={{ background: "none", border: "none", color: "#E05555", fontSize: 16, cursor: "pointer", marginBottom: 14, padding: "0 4px" }}>×</button>}
            </div>
          ))}
          <Btn v="ghost" s={{ fontSize: 11, padding: "5px 12px" }} onClick={() => setVarForms(prev => [...prev, blankVariant()])}>+ Add Size</Btn>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setAddModal(false)}>Cancel</Btn>
          <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Save Product"}</Btn>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Product">
        {editForm && <>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Name *" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} half />
            <Field label="Brand" value={editForm.brand} onChange={v => setEditForm(f => ({ ...f, brand: v }))} half />
          </div>
          <Field label="Vendor" value={editForm.vendorId || ""} onChange={v => setEditForm(f => ({ ...f, vendorId: v }))} options={vendorOptions} />
          <Field label="Notes" value={editForm.notes} onChange={v => setEditForm(f => ({ ...f, notes: v }))} multiline />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn v="ghost" onClick={() => setEditModal(null)}>Cancel</Btn>
            <Btn onClick={handleEditProduct} disabled={saving}>{saving ? "…" : "Save"}</Btn>
          </div>
        </>}
      </Modal>

      {/* Add Variant Modal */}
      <Modal open={!!varModal} onClose={() => setVarModal(null)} title="Add Size / Variant">
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Size *" value={varForm.size} onChange={v => setVarForm(f => ({ ...f, size: v }))} placeholder="e.g. King" half />
          <Field label="Qty on Hand" value={varForm.qty} onChange={v => setVarForm(f => ({ ...f, qty: v }))} type="number" placeholder="0" half />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Cost" value={varForm.cost} onChange={v => setVarForm(f => ({ ...f, cost: v }))} type="number" placeholder="0.00" half />
          <Field label="Retail Price" value={varForm.retailPrice} onChange={v => setVarForm(f => ({ ...f, retailPrice: v }))} type="number" placeholder="0.00" half />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setVarModal(null)}>Cancel</Btn>
          <Btn onClick={handleAddVariant} disabled={saving}>{saving ? "…" : "Add Variant"}</Btn>
        </div>
      </Modal>

      {/* Edit Variant Modal */}
      <Modal open={!!editVarModal} onClose={() => setEditVarModal(null)} title="Edit Variant">
        {editVarForm && <>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Size *" value={editVarForm.size} onChange={v => setEditVarForm(f => ({ ...f, size: v }))} half />
            <Field label="Qty" value={editVarForm.qty} onChange={v => setEditVarForm(f => ({ ...f, qty: v }))} type="number" half />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Cost" value={editVarForm.cost} onChange={v => setEditVarForm(f => ({ ...f, cost: v }))} type="number" half />
            <Field label="Retail Price" value={editVarForm.retailPrice} onChange={v => setEditVarForm(f => ({ ...f, retailPrice: v }))} type="number" half />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn v="ghost" onClick={() => setEditVarModal(null)}>Cancel</Btn>
            <Btn onClick={handleEditVariant} disabled={saving}>{saving ? "…" : "Save"}</Btn>
          </div>
        </>}
      </Modal>

      {/* Adjust Inventory Modal */}
      <Modal open={!!adjustModal} onClose={() => setAdjustModal(null)} title={`Adjust Stock — ${adjustModal?.size}`}>
        <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "var(--dim)" }}>Current qty: <span style={{ fontWeight: 700, fontFamily: "var(--mono)", color: "var(--text)" }}>{adjustModal?.quantityOnHand}</span></div>
        </div>
        <Field label="New Quantity *" value={adjustQty} onChange={setAdjustQty} type="number" placeholder="0" min="0" />
        <Field label="Reason *" value={adjustReason} onChange={setAdjustReason} placeholder="e.g. stock count correction, damaged unit removed…" multiline />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setAdjustModal(null)}>Cancel</Btn>
          <Btn onClick={handleAdjust} disabled={saving || !adjustReason.trim() || adjustQty === ""}>{saving ? "…" : "Save Adjustment"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

