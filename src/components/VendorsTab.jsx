import { useState, useMemo } from "react";
import { Modal, Field, Btn, TH, TD, Badge, hoverRow, LineItemBuilder } from "./ui.jsx";
import { fmt, today } from "../utils.js";

function blankVendor() { return { name: "", contactName: "", phone: "", email: "", address: "", paymentTerms: "", notes: "" }; }
function blankPurchase(vendorId = "") { return { vendorId, date: today(), invoiceNumber: "", notes: "", amountPaid: "" }; }

export function VendorsTab({ vendors, products, vendorPurchases, addVendor, editVendor, deleteVendor, addVendorPurchase, deleteVendorPurchase }) {
  const [form, setForm]               = useState(blankVendor());
  const [editForm, setEditForm]       = useState(null);
  const [editModal, setEditModal]     = useState(null);
  const [addModal, setAddModal]       = useState(false);
  const [purchaseModal, setPurchaseModal]     = useState(null); // vendor id
  const [purchaseForm, setPurchaseForm]       = useState(blankPurchase());
  const [purchaseItems, setPurchaseItems]     = useState([]);
  const [detailVendor, setDetailVendor]       = useState(null);
  const [saving, setSaving]                   = useState(false);

  // Build flat catalog for LineItemBuilder
  const catalog = useMemo(() => products.flatMap(p => p.variants.map(v => ({
    id: v.id, productName: p.name, size: v.size, cost: v.cost, retailPrice: v.retailPrice, quantityOnHand: v.quantityOnHand,
  }))), [products]);

  // Vendor balance = total purchases - total paid
  const vendorBalance = (vendorId) => {
    const purchases = vendorPurchases.filter(p => p.vendorId === vendorId);
    return purchases.reduce((s, p) => s + (p.total - p.amountPaid), 0);
  };
  const totalOwed = vendors.reduce((s, v) => s + Math.max(0, vendorBalance(v.id)), 0);

  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try { await addVendor(form); setForm(blankVendor()); setAddModal(false); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editForm?.name) return;
    setSaving(true);
    try { await editVendor(editModal, editForm); setEditModal(null); }
    catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleAddPurchase = async () => {
    if (!purchaseForm.vendorId) return;
    setSaving(true);
    try {
      await addVendorPurchase(purchaseForm, purchaseItems.filter(i => i.description || i.variantId));
      setPurchaseModal(null); setPurchaseForm(blankPurchase()); setPurchaseItems([]);
    } catch (e) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const openPurchaseModal = (vendorId) => {
    setPurchaseForm(blankPurchase(vendorId));
    setPurchaseItems([]);
    setPurchaseModal(vendorId);
  };

  const selectedVendor = detailVendor ? vendors.find(v => v.id === detailVendor) : null;
  const selectedPurchases = detailVendor ? vendorPurchases.filter(p => p.vendorId === detailVendor) : [];

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "var(--card)", borderRadius: 12, padding: "14px 16px", borderLeft: "4px solid #E8853D" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dim)", marginBottom: 3 }}>Vendors</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)" }}>{vendors.length}</div>
        </div>
        <div style={{ background: "var(--card)", borderRadius: 12, padding: "14px 16px", borderLeft: "4px solid #E05555" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dim)", marginBottom: 3 }}>Total Owed to Vendors</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)", color: totalOwed > 0 ? "#E05555" : "#22D3A5" }}>{fmt(totalOwed)}</div>
        </div>
        <div style={{ background: "var(--card)", borderRadius: 12, padding: "14px 16px", borderLeft: "4px solid #5B8DEF" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dim)", marginBottom: 3 }}>Purchase Orders</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--mono)" }}>{vendorPurchases.length}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Btn onClick={() => { setForm(blankVendor()); setAddModal(true); }}>+ Add Vendor</Btn>
      </div>

      {vendors.length === 0
        ? <div style={{ background: "var(--card)", borderRadius: 12, padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>No vendors yet. Click "+ Add Vendor" to get started.</div>
        : (
          <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>
                  <TH>Vendor</TH><TH>Contact</TH><TH>Phone</TH><TH>Email</TH><TH right>Balance Owed</TH><TH></TH>
                </tr></thead>
                <tbody>
                  {vendors.map(v => {
                    const bal = vendorBalance(v.id);
                    return (
                      <tr key={v.id} onClick={() => setDetailVendor(v.id)} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer", transition: "background 0.15s" }} {...hoverRow}>
                        <TD bold>{v.name}</TD>
                        <TD color="var(--dim)">{v.contactName}</TD>
                        <TD color="var(--dim)">{v.phone}</TD>
                        <TD color="var(--dim)">{v.email}</TD>
                        <TD right mono bold color={bal > 0 ? "#E05555" : "#22D3A5"}>{bal > 0 ? fmt(bal) : "PAID"}</TD>
                        <TD>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Btn v="ghost" s={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); openPurchaseModal(v.id); }}>+ Purchase</Btn>
                            <Btn v="ghost" s={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); setEditForm({ ...v }); setEditModal(v.id); }}>Edit</Btn>
                            <Btn v="danger" s={{ padding: "4px 10px", fontSize: 11 }} onClick={e => { e.stopPropagation(); if (confirm(`Delete ${v.name}?`)) deleteVendor(v.id); }}>×</Btn>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Vendor Detail Modal */}
      <Modal open={!!detailVendor} onClose={() => setDetailVendor(null)} title={selectedVendor?.name || ""} wide>
        {selectedVendor && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[["Contact", selectedVendor.contactName], ["Phone", selectedVendor.phone], ["Email", selectedVendor.email], ["Payment Terms", selectedVendor.paymentTerms]].filter(([, v]) => v).map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13 }}>{v}</div></div>
              ))}
            </div>
            {selectedVendor.address && <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 16 }}>{selectedVendor.address}</div>}
            {selectedVendor.notes && <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--dim)" }}>{selectedVendor.notes}</div>}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Purchase History</div>
              <Btn s={{ padding: "5px 12px", fontSize: 11 }} onClick={() => { setDetailVendor(null); openPurchaseModal(selectedVendor.id); }}>+ New Purchase</Btn>
            </div>

            {selectedPurchases.length === 0
              ? <div style={{ color: "var(--dim)", fontSize: 13, marginBottom: 20 }}>No purchases recorded yet.</div>
              : (
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                  <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <TH>Date</TH><TH>Invoice</TH><TH right>Total</TH><TH right>Paid</TH><TH right>Owed</TH><TH></TH>
                  </tr></thead>
                  <tbody>
                    {selectedPurchases.map(p => {
                      const owed = p.total - p.amountPaid;
                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <TD mono>{p.date}</TD>
                          <TD color="var(--dim)">{p.invoiceNumber || "—"}</TD>
                          <TD right mono bold>{fmt(p.total)}</TD>
                          <TD right mono color="#22D3A5">{fmt(p.amountPaid)}</TD>
                          <TD right mono bold color={owed > 0 ? "#E05555" : "#22D3A5"}>{owed > 0 ? fmt(owed) : "PAID"}</TD>
                          <TD><Btn v="danger" s={{ padding: "3px 8px", fontSize: 10 }} onClick={() => { if (confirm("Delete this purchase?")) deleteVendorPurchase(p.id, "Manual deletion"); }}>×</Btn></TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn v="ghost" onClick={() => setDetailVendor(null)}>Close</Btn>
              <Btn v="ghost" onClick={() => { setDetailVendor(null); setEditForm({ ...selectedVendor }); setEditModal(selectedVendor.id); }}>Edit Vendor</Btn>
            </div>
          </>
        )}
      </Modal>

      {/* Add Vendor Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Vendor">
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Vendor Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Company name" half />
          <Field label="Contact Name" value={form.contactName} onChange={v => setForm(f => ({ ...f, contactName: v }))} placeholder="Rep name" half />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="Phone" half />
          <Field label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="Email" half />
        </div>
        <Field label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="Full address" />
        <Field label="Payment Terms" value={form.paymentTerms} onChange={v => setForm(f => ({ ...f, paymentTerms: v }))} placeholder="e.g. Net 30, COD" />
        <Field label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} multiline placeholder="Internal notes…" />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setAddModal(false)}>Cancel</Btn>
          <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Save Vendor"}</Btn>
        </div>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Vendor">
        {editForm && <>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Name *" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} half />
            <Field label="Contact" value={editForm.contactName} onChange={v => setEditForm(f => ({ ...f, contactName: v }))} half />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Phone" value={editForm.phone} onChange={v => setEditForm(f => ({ ...f, phone: v }))} half />
            <Field label="Email" value={editForm.email} onChange={v => setEditForm(f => ({ ...f, email: v }))} half />
          </div>
          <Field label="Address" value={editForm.address} onChange={v => setEditForm(f => ({ ...f, address: v }))} />
          <Field label="Payment Terms" value={editForm.paymentTerms} onChange={v => setEditForm(f => ({ ...f, paymentTerms: v }))} />
          <Field label="Notes" value={editForm.notes} onChange={v => setEditForm(f => ({ ...f, notes: v }))} multiline />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <Btn v="ghost" onClick={() => setEditModal(null)}>Cancel</Btn>
            <Btn onClick={handleEdit} disabled={saving}>{saving ? "…" : "Save"}</Btn>
          </div>
        </>}
      </Modal>

      {/* Add Purchase Modal */}
      <Modal open={!!purchaseModal} onClose={() => setPurchaseModal(null)} title="New Vendor Purchase" wide>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Vendor" value={purchaseForm.vendorId} onChange={v => setPurchaseForm(f => ({ ...f, vendorId: v }))} options={vendors.map(v => ({ value: v.id, label: v.name }))} half />
          <Field label="Date" value={purchaseForm.date} onChange={v => setPurchaseForm(f => ({ ...f, date: v }))} type="date" half />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Invoice #" value={purchaseForm.invoiceNumber} onChange={v => setPurchaseForm(f => ({ ...f, invoiceNumber: v }))} placeholder="Optional" half />
          <Field label="Amount Paid" value={purchaseForm.amountPaid} onChange={v => setPurchaseForm(f => ({ ...f, amountPaid: v }))} type="number" placeholder="0.00" half />
        </div>
        <Field label="Notes" value={purchaseForm.notes} onChange={v => setPurchaseForm(f => ({ ...f, notes: v }))} placeholder="Notes…" />

        <div style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 16 }}>
          <LineItemBuilder
            items={purchaseItems}
            setItems={setPurchaseItems}
            catalog={catalog}
            catalogLabel="Product (optional)"
          />
        </div>

        {purchaseItems.length > 0 && (
          <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--dim)" }}>Purchase Total:</span>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{fmt(purchaseItems.reduce((s, i) => s + i.qty * i.cost, 0))}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Btn v="ghost" onClick={() => setPurchaseModal(null)}>Cancel</Btn>
          <Btn onClick={handleAddPurchase} disabled={saving}>{saving ? "Saving…" : "Save Purchase"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

