import { useState, useCallback, useEffect } from "react";
import { supabase } from "../supabase";

async function writeLog(action, entityType, entityId, reason, dataBefore, dataAfter) {
  await supabase.from("audit_logs").insert([{
    action, entity_type: entityType, entity_id: entityId || null,
    reason: reason || null,
    data_before: dataBefore ? dataBefore : null,
    data_after:  dataAfter  ? dataAfter  : null,
  }]);
}

export function useData() {
  const [sales, setSales]             = useState([]);
  const [expenses, setExpenses]       = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [vendors, setVendors]         = useState([]);
  const [products, setProducts]       = useState([]);
  const [variants, setVariants]       = useState([]);
  const [vendorPurchases, setVendorPurchases] = useState([]);
  const [auditLogs, setAuditLogs]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [
        { data: saleRows,    error: e1 },
        { data: payRows,     error: e2 },
        { data: expRows,     error: e3 },
        { data: spRows,      error: e4 },
        { data: vendorRows,  error: e5 },
        { data: prodRows,    error: e6 },
        { data: varRows,     error: e7 },
        { data: saleItemRows,error: e8 },
        { data: vpRows,      error: e9 },
        { data: vpiRows,     error: e10 },
        { data: logRows,     error: e11 },
      ] = await Promise.all([
        supabase.from("sales").select("*").is("deleted_at", null).order("date", { ascending: false }),
        supabase.from("payments").select("*").is("deleted_at", null).order("date", { ascending: true }),
        supabase.from("expenses").select("*").is("deleted_at", null).order("date", { ascending: false }),
        supabase.from("salespeople").select("*").order("name"),
        supabase.from("vendors").select("*").order("name"),
        supabase.from("products").select("*").order("name"),
        supabase.from("product_variants").select("*"),
        supabase.from("sale_items").select("*"),
        supabase.from("vendor_purchases").select("*").is("deleted_at", null).order("date", { ascending: false }),
        supabase.from("vendor_purchase_items").select("*"),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      if (e1||e2||e3||e4||e5||e6||e7||e8||e9||e10||e11) throw e1||e2||e3||e4||e5||e6||e7||e8||e9||e10||e11;

      // Build payment map
      const payMap = {};
      (payRows || []).forEach(p => {
        if (!payMap[p.sale_id]) payMap[p.sale_id] = [];
        payMap[p.sale_id].push({ id: p.id, date: p.date, amount: Number(p.amount), method: p.method, note: p.note });
      });

      // Build sale items map
      const saleItemMap = {};
      (saleItemRows || []).forEach(si => {
        if (!saleItemMap[si.sale_id]) saleItemMap[si.sale_id] = [];
        saleItemMap[si.sale_id].push({ id: si.id, variantId: si.variant_id, vendorId: si.vendor_id || null, description: si.description, quantity: si.quantity, priceAtSale: Number(si.price_at_sale), costAtSale: Number(si.cost_at_sale) });
      });

      setSales((saleRows || []).map(s => ({
        id: s.id, date: s.date, customer: s.customer, phone: s.phone || "",
        items: s.items || "", address: s.address || "",
        price: Number(s.price), cost: Number(s.cost || 0),
        salesperson: s.salesperson || "", deliveryDate: s.delivery_date || "",
        deliveryTime: s.delivery_time || "", delivered: s.delivered || false,
        notes: s.notes || "", cancelledAt: s.cancelled_at || null,
        cancelledReason: s.cancelled_reason || "",
        payments: payMap[s.id] || [],
        saleItems: saleItemMap[s.id] || [],
      })));

      setExpenses((expRows || []).map(e => ({ id: e.id, date: e.date, category: e.category, vendor: e.vendor, amount: Number(e.amount), note: e.note || "" })));
      setSalespeople((spRows || []).map(s => s.name));
      setVendors((vendorRows || []).map(v => ({ id: v.id, name: v.name, contactName: v.contact_name || "", phone: v.phone || "", email: v.email || "", address: v.address || "", paymentTerms: v.payment_terms || "", notes: v.notes || "" })));

      // Build variant map for products
      const varMap = {};
      (varRows || []).forEach(v => {
        if (!varMap[v.product_id]) varMap[v.product_id] = [];
        varMap[v.product_id].push({ id: v.id, productId: v.product_id, size: v.size, cost: Number(v.cost), retailPrice: Number(v.retail_price), quantityOnHand: v.quantity_on_hand });
      });
      setVariants(varRows || []);
      setProducts((prodRows || []).map(p => ({ id: p.id, name: p.name, brand: p.brand || "", vendorId: p.vendor_id || null, notes: p.notes || "", variants: varMap[p.id] || [] })));

      // Build vendor purchase items map
      const vpiMap = {};
      (vpiRows || []).forEach(i => {
        if (!vpiMap[i.purchase_id]) vpiMap[i.purchase_id] = [];
        vpiMap[i.purchase_id].push({ id: i.id, variantId: i.variant_id, description: i.description, quantity: i.quantity, unitCost: Number(i.unit_cost) });
      });
      setVendorPurchases((vpRows || []).map(p => ({
        id: p.id, vendorId: p.vendor_id, date: p.date,
        invoiceNumber: p.invoice_number || "", notes: p.notes || "",
        amountPaid: Number(p.amount_paid),
        items: vpiMap[p.id] || [],
        total: (vpiMap[p.id] || []).reduce((s, i) => s + i.quantity * i.unitCost, 0),
      })));

      setAuditLogs((logRows || []).map(l => ({ id: l.id, action: l.action, entityType: l.entity_type, entityId: l.entity_id, reason: l.reason, dataBefore: l.data_before, dataAfter: l.data_after, createdAt: l.created_at })));
    } catch (err) { setError(err.message || "Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Sales ──────────────────────────────────────────────────────────────────
  const addSale = async (saleData, initPayment, lineItems) => {
    const price = lineItems?.length ? lineItems.reduce((s, i) => s + i.qty * i.price, 0) : Number(saleData.price);
    const cost  = lineItems?.length ? lineItems.reduce((s, i) => s + i.qty * i.cost,  0) : Number(saleData.cost || 0);

    const { data: sale, error: se } = await supabase.from("sales").insert([{
      date: saleData.date, customer: saleData.customer, phone: saleData.phone,
      items: lineItems?.length ? lineItems.map(i => `${i.qty}x ${i.description}`).join(", ") : saleData.items,
      address: saleData.address, price, cost,
      salesperson: saleData.salesperson,
      delivery_date: saleData.deliveryDate || null,
      delivery_time: saleData.deliveryTime || null,
      notes: saleData.notes || null, delivered: false,
    }]).select().single();
    if (se) throw se;

    // Insert sale items + decrement inventory
    if (lineItems?.length) {
      const saleItemInserts = lineItems.map(i => ({
        sale_id: sale.id, variant_id: i.variantId || null,
        vendor_id: i.vendorId || null,
        description: i.description, quantity: i.qty,
        price_at_sale: i.price, cost_at_sale: i.cost,
      }));
      const { error: sie } = await supabase.from("sale_items").insert(saleItemInserts);
      if (sie) throw sie;

      // Decrement inventory for catalog items
      for (const item of lineItems.filter(i => i.variantId)) {
        await supabase.rpc ? null : null; // fallback below
        const { error: ve } = await supabase.from("product_variants").update({ quantity_on_hand: supabase.rpc ? undefined : undefined }).eq("id", item.variantId);
        // Use raw decrement via direct update
        const current = variants.find(v => v.id === item.variantId);
        if (current) {
          await supabase.from("product_variants").update({ quantity_on_hand: Math.max(0, current.quantity_on_hand - item.qty) }).eq("id", item.variantId);
        }
      }
    }

    if (initPayment && Number(initPayment.amount) > 0) {
      const { error: pe } = await supabase.from("payments").insert([{ sale_id: sale.id, date: saleData.date, amount: Number(initPayment.amount), method: initPayment.method, note: initPayment.note || "Initial deposit" }]);
      if (pe) throw pe;
    }

    await writeLog("create", "sale", sale.id, null, null, { customer: saleData.customer, price });
    await loadAll();
  };

  const editSale = async (saleId, updates, reason) => {
    const original = sales.find(s => s.id === saleId);
    const { error } = await supabase.from("sales").update({
      date: updates.date, customer: updates.customer, phone: updates.phone, items: updates.items,
      address: updates.address, price: Number(updates.price), cost: Number(updates.cost || 0),
      salesperson: updates.salesperson, delivery_date: updates.deliveryDate || null,
      delivery_time: updates.deliveryTime || null, notes: updates.notes || null,
    }).eq("id", saleId);
    if (error) throw error;
    await writeLog("edit", "sale", saleId, reason, original, updates);
    await loadAll();
  };

  const cancelSale = async (saleId, reason) => {
    const original = sales.find(s => s.id === saleId);
    const { error } = await supabase.from("sales").update({ cancelled_at: new Date().toISOString(), cancelled_reason: reason }).eq("id", saleId);
    if (error) throw error;
    await writeLog("cancel", "sale", saleId, reason, original, null);
    await loadAll();
  };

  const deleteSale = async (saleId, reason) => {
    const original = sales.find(s => s.id === saleId);
    const { error } = await supabase.from("sales").update({ deleted_at: new Date().toISOString(), deleted_reason: reason }).eq("id", saleId);
    if (error) throw error;
    await writeLog("delete", "sale", saleId, reason, original, null);
    await loadAll();
  };

  // ── Payments ───────────────────────────────────────────────────────────────
  const recordPayment = async (saleId, payData) => {
    const { error } = await supabase.from("payments").insert([{ sale_id: saleId, date: payData.date, amount: Number(payData.amount), method: payData.method, note: payData.note || "" }]);
    if (error) throw error;
    await writeLog("create", "payment", saleId, null, null, payData);
    await loadAll();
  };

  const deletePayment = async (paymentId, reason) => {
    const sale = sales.find(s => s.payments.some(p => p.id === paymentId));
    const payment = sale?.payments.find(p => p.id === paymentId);
    const { error } = await supabase.from("payments").update({ deleted_at: new Date().toISOString(), deleted_reason: reason }).eq("id", paymentId);
    if (error) throw error;
    await writeLog("refund", "payment", paymentId, reason, payment, null);
    await loadAll();
  };

  const toggleDelivered = async (saleId, current) => {
    const { error } = await supabase.from("sales").update({ delivered: !current }).eq("id", saleId);
    if (error) throw error;
    await writeLog(!current ? "delivered" : "undelivered", "sale", saleId, null, null, null);
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, delivered: !current } : s));
  };

  // ── Expenses ───────────────────────────────────────────────────────────────
  const addExpense = async (expData) => {
    const { data, error } = await supabase.from("expenses").insert([{ date: expData.date, category: expData.category, vendor: expData.vendor, amount: Number(expData.amount), note: expData.note || "" }]).select().single();
    if (error) throw error;
    await writeLog("create", "expense", data.id, null, null, expData);
    await loadAll();
  };

  const deleteExpense = async (expId, reason) => {
    const original = expenses.find(e => e.id === expId);
    const { error } = await supabase.from("expenses").update({ deleted_at: new Date().toISOString(), deleted_reason: reason }).eq("id", expId);
    if (error) throw error;
    await writeLog("delete", "expense", expId, reason, original, null);
    setExpenses(prev => prev.filter(e => e.id !== expId));
  };

  // ── Salespeople ────────────────────────────────────────────────────────────
  const addSalesperson = async (name) => {
    const { error } = await supabase.from("salespeople").insert([{ name }]);
    if (error) throw error;
    setSalespeople(prev => [...prev, name].sort());
  };

  // ── Vendors ────────────────────────────────────────────────────────────────
  const addVendor = async (data) => {
    const { error } = await supabase.from("vendors").insert([{ name: data.name, contact_name: data.contactName, phone: data.phone, email: data.email, address: data.address, payment_terms: data.paymentTerms, notes: data.notes }]);
    if (error) throw error;
    await loadAll();
  };

  const editVendor = async (id, data) => {
    const { error } = await supabase.from("vendors").update({ name: data.name, contact_name: data.contactName, phone: data.phone, email: data.email, address: data.address, payment_terms: data.paymentTerms, notes: data.notes }).eq("id", id);
    if (error) throw error;
    await loadAll();
  };

  const deleteVendor = async (id) => {
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) throw error;
    await loadAll();
  };

  // ── Vendor Purchases ───────────────────────────────────────────────────────
  const addVendorPurchase = async (data, items) => {
    const { data: vp, error: ve } = await supabase.from("vendor_purchases").insert([{
      vendor_id: data.vendorId, date: data.date,
      invoice_number: data.invoiceNumber || null,
      notes: data.notes || null, amount_paid: Number(data.amountPaid || 0),
    }]).select().single();
    if (ve) throw ve;

    if (items?.length) {
      const { error: ie } = await supabase.from("vendor_purchase_items").insert(items.map(i => ({ purchase_id: vp.id, variant_id: i.variantId || null, description: i.description, quantity: i.qty, unit_cost: i.unitCost })));
      if (ie) throw ie;

      // Increment inventory
      for (const item of items.filter(i => i.variantId)) {
        const current = variants.find(v => v.id === item.variantId);
        if (current) {
          await supabase.from("product_variants").update({ quantity_on_hand: current.quantity_on_hand + item.qty }).eq("id", item.variantId);
        }
      }
    }

    await writeLog("create", "vendor_purchase", vp.id, null, null, { vendor: data.vendorId, date: data.date });
    await loadAll();
  };

  const deleteVendorPurchase = async (id, reason) => {
    const { error } = await supabase.from("vendor_purchases").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await writeLog("delete", "vendor_purchase", id, reason, null, null);
    await loadAll();
  };

  // ── Products & Variants ───────────────────────────────────────────────────
  const addProduct = async (data) => {
    const { data: prod, error: pe } = await supabase.from("products").insert([{ name: data.name, brand: data.brand || null, vendor_id: data.vendorId || null, notes: data.notes || null }]).select().single();
    if (pe) throw pe;
    if (data.variants?.length) {
      const { error: ve } = await supabase.from("product_variants").insert(data.variants.map(v => ({ product_id: prod.id, size: v.size, cost: Number(v.cost || 0), retail_price: Number(v.retailPrice || 0), quantity_on_hand: Number(v.qty || 0) })));
      if (ve) throw ve;
    }
    await loadAll();
  };

  const editProduct = async (id, data) => {
    const { error } = await supabase.from("products").update({ name: data.name, brand: data.brand || null, vendor_id: data.vendorId || null, notes: data.notes || null }).eq("id", id);
    if (error) throw error;
    await loadAll();
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    await loadAll();
  };

  const addVariant = async (productId, data) => {
    const { error } = await supabase.from("product_variants").insert([{ product_id: productId, size: data.size, cost: Number(data.cost || 0), retail_price: Number(data.retailPrice || 0), quantity_on_hand: Number(data.qty || 0) }]);
    if (error) throw error;
    await loadAll();
  };

  const editVariant = async (id, data) => {
    const { error } = await supabase.from("product_variants").update({ size: data.size, cost: Number(data.cost || 0), retail_price: Number(data.retailPrice || 0), quantity_on_hand: Number(data.qty || 0) }).eq("id", id);
    if (error) throw error;
    await loadAll();
  };

  const deleteVariant = async (id) => {
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) throw error;
    await loadAll();
  };

  const adjustInventory = async (variantId, newQty, reason) => {
    const current = variants.find(v => v.id === variantId);
    const { error } = await supabase.from("product_variants").update({ quantity_on_hand: newQty }).eq("id", variantId);
    if (error) throw error;
    await writeLog("adjust_inventory", "variant", variantId, reason, { qty: current?.quantity_on_hand }, { qty: newQty });
    await loadAll();
  };

  return {
    sales, expenses, salespeople, vendors, products, variants, vendorPurchases, auditLogs,
    loading, error,
    addSale, editSale, cancelSale, deleteSale,
    recordPayment, deletePayment, toggleDelivered,
    addExpense, deleteExpense,
    addSalesperson,
    addVendor, editVendor, deleteVendor,
    addVendorPurchase, deleteVendorPurchase,
    addProduct, editProduct, deleteProduct,
    addVariant, editVariant, deleteVariant, adjustInventory,
    reload: loadAll,
  };
}
