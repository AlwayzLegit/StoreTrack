import { useState, useMemo } from "react";
import { TH, TD, Badge, hoverRow, Modal } from "./ui.jsx";

const ACTION_COLORS = {
  create:           { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  edit:             { color: "#5B8DEF", bg: "rgba(91,141,239,0.12)" },
  delete:           { color: "#D45B5B", bg: "rgba(212,91,91,0.12)"  },
  cancel:           { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  refund:           { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  delivered:        { color: "#2DD4A8", bg: "rgba(45,212,168,0.12)" },
  undelivered:      { color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
  adjust_inventory: { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
};

const ENTITY_LABELS = {
  sale: "Sale", payment: "Payment", expense: "Expense",
  vendor_purchase: "Vendor Purchase", variant: "Inventory",
};

function fmtTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function LogsTab({ auditLogs }) {
  const [search, setSearch]       = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [detail, setDetail]       = useState(null);

  const filtered = useMemo(() => {
    let list = auditLogs;
    if (filterAction !== "all") list = list.filter(l => l.action === filterAction);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => l.action.includes(q) || l.entityType.includes(q) || (l.reason || "").toLowerCase().includes(q));
    }
    return list;
  }, [auditLogs, filterAction, search]);

  const actions = ["all", ...Array.from(new Set(auditLogs.map(l => l.action))).sort()];

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…"
          style={{ padding: "9px 13px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--card)", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", flex: "0 0 220px" }} />
        <div style={{ display: "flex", gap: 3, background: "var(--card)", borderRadius: 8, padding: 3, flexWrap: "wrap" }}>
          {actions.map(a => (
            <button key={a} onClick={() => setFilterAction(a)}
              style={{ padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: filterAction === a ? "var(--accent)" : "transparent", color: filterAction === a ? "#fff" : "var(--dim)", textTransform: "capitalize" }}>
              {a === "all" ? "All" : a}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--dim)", fontFamily: "var(--mono)" }}>{filtered.length} entries</div>
      </div>

      <div style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>
              <TH>Time</TH><TH>Action</TH><TH>Type</TH><TH>Reason</TH><TH></TH>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: "var(--dim)", fontSize: 13 }}>No log entries yet.</td></tr>
              )}
              {filtered.map(l => {
                const c = ACTION_COLORS[l.action] || { color: "var(--dim)", bg: "var(--line)" };
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer", transition: "background 0.15s" }} {...hoverRow} onClick={() => setDetail(l)}>
                    <TD mono style={{ fontSize: 11, color: "var(--dim)" }}>{fmtTs(l.createdAt)}</TD>
                    <TD><Badge text={l.action} color={c.color} bg={c.bg} /></TD>
                    <TD><span style={{ fontSize: 12, color: "var(--dim)", textTransform: "capitalize" }}>{ENTITY_LABELS[l.entityType] || l.entityType}</span></TD>
                    <TD style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", fontSize: 12, color: l.reason ? "var(--text)" : "var(--dim)" }}>
                      {l.reason || <span style={{ fontStyle: "italic" }}>—</span>}
                    </TD>
                    <TD style={{ fontSize: 11, color: "var(--accent)" }}>{(l.dataBefore || l.dataAfter) ? "View →" : ""}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Log Entry Detail" wide>
        {detail && (() => {
          const c = ACTION_COLORS[detail.action] || { color: "var(--dim)", bg: "var(--line)" };
          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div><div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Action</div><Badge text={detail.action} color={c.color} bg={c.bg} /></div>
                <div><div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Entity Type</div><div style={{ fontSize: 13, textTransform: "capitalize" }}>{ENTITY_LABELS[detail.entityType] || detail.entityType}</div></div>
                <div><div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Time</div><div style={{ fontSize: 13, fontFamily: "var(--mono)" }}>{fmtTs(detail.createdAt)}</div></div>
                {detail.entityId && <div><div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Entity ID</div><div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--dim)" }}>{detail.entityId}</div></div>}
              </div>

              {detail.reason && (
                <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, borderLeft: "3px solid #F59E0B" }}>
                  <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Reason</div>
                  <div style={{ fontSize: 13 }}>{detail.reason}</div>
                </div>
              )}

              {(detail.dataBefore || detail.dataAfter) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {detail.dataBefore && (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Before</div>
                      <pre style={{ background: "var(--card)", borderRadius: 8, padding: "10px 12px", fontSize: 11, fontFamily: "var(--mono)", color: "var(--dim)", overflow: "auto", maxHeight: 200, margin: 0 }}>
                        {JSON.stringify(detail.dataBefore, null, 2)}
                      </pre>
                    </div>
                  )}
                  {detail.dataAfter && (
                    <div>
                      <div style={{ fontSize: 10, color: "var(--dim)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>After</div>
                      <pre style={{ background: "var(--card)", borderRadius: 8, padding: "10px 12px", fontSize: 11, fontFamily: "var(--mono)", color: "var(--dim)", overflow: "auto", maxHeight: 200, margin: 0 }}>
                        {JSON.stringify(detail.dataAfter, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </Modal>
    </div>
  );
}
