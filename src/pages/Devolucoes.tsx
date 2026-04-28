import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type VendaOption = {
  id: number;
  cliente_nome: string;
  valor_total: number;
  created_at: string;
  itens: { id: number; product_name: string; size: string; quantity: number; unit_price: number }[];
};

type Devolucao = {
  id: number;
  venda_id: number;
  cliente_nome: string;
  vendedor_nome: string;
  valor_venda: number;
  valor_devolvido: number;
  motivo: string;
  observacoes: string | null;
  created_at: string;
};

type ItemDevolvido = { venda_item_id: number; quantity: number };

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  page:     { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:    { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle: { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid:     { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card:     { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  label:    { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  input:    { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  select:   { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" as const } as React.CSSProperties,
  formGroup: { marginBottom: "16px" } as React.CSSProperties,
  row:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } as React.CSSProperties,
  btnPrimary: { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger:  { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  table:  { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:     { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  td:     { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
};

// ── Componente ─────────────────────────────────────────────────────────────────
export default function Devolucoes() {
  const [devolucoes, setDevolucoes]   = useState<Devolucao[]>([]);
  const [vendas, setVendas]           = useState<VendaOption[]>([]);
  const [loading, setLoading]         = useState(false);
  const [salvando, setSalvando]       = useState(false);

  // Form
  const [vendaId, setVendaId]               = useState("");
  const [motivo, setMotivo]                 = useState("");
  const [valorDevolvido, setValorDevolvido] = useState("");
  const [observacoes, setObservacoes]       = useState("");
  const [itensDevolvidos, setItensDevolvidos] = useState<Record<number, number>>({});

  const carregar = async () => {
    setLoading(true);
    try {
      const [resD, resV] = await Promise.all([
        fetch(`${API_URL}/devolucoes/`),
        fetch(`${API_URL}/vendas/`),
      ]);
      const [jD, jV] = await Promise.all([resD.json(), resV.json()]);

      const todasVendas: VendaOption[] = jV.data || [];
      const idsDevolvidos = new Set((jD.data || []).map((d: Devolucao) => d.venda_id));

      setDevolucoes(jD.data || []);
      // Remove vendas que já têm devolução
      setVendas(todasVendas.filter(v => !idsDevolvidos.has(v.id)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const vendaSelecionada = vendas.find(v => String(v.id) === vendaId);

  const resetForm = () => {
    setVendaId(""); setMotivo(""); setValorDevolvido(""); setObservacoes(""); setItensDevolvidos({});
  };

  const salvar = async () => {
    if (!vendaId)        { alert("Selecione a venda."); return; }
    if (!motivo.trim())  { alert("Informe o motivo."); return; }
    if (!valorDevolvido || Number(valorDevolvido) <= 0) { alert("Informe o valor devolvido."); return; }

    const itensArr: ItemDevolvido[] = Object.entries(itensDevolvidos)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ venda_item_id: Number(id), quantity: qty }));

    setSalvando(true);
    try {
      const res = await fetch(`${API_URL}/devolucoes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venda_id:        Number(vendaId),
          motivo,
          valor_devolvido: Number(valorDevolvido),
          observacoes:     observacoes || null,
          itens_devolvidos: itensArr,
        }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || "Erro ao registrar."); return; }
      resetForm();
      carregar();
    } catch {
      alert("Erro ao registrar devolução.");
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: number) => {
    if (!confirm("Excluir esta devolução?")) return;
    await fetch(`${API_URL}/devolucoes/${id}`, { method: "DELETE" });
    carregar();
  };

  const totalValor  = devolucoes.reduce((a, d) => a + d.valor_devolvido, 0);
  const totalItens  = devolucoes.length;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Devoluções</h1>
      <p style={s.subtitle}>Controle das devoluções com restauração automática de estoque.</p>

      {/* Cards */}
      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total de Devoluções</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{totalItens}</h2>
        </div>
        <div style={s.summaryCard("#dc2626")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Valor Devolvido</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800, color: "#dc2626" }}>
            R$ {totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div style={s.summaryCard("#f59e0b")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Vendas Disponíveis p/ Devolução</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{vendas.length}</h2>
        </div>
      </div>

      {/* Formulário */}
      <div style={s.card}>
        <h2 style={{ margin: "0 0 20px", color: "#071633" }}>Registrar Devolução</h2>

        <div style={s.formGroup}>
          <label style={s.label}>Venda *</label>
          <select style={s.select} value={vendaId} onChange={e => { setVendaId(e.target.value); setItensDevolvidos({}); }}>
            <option value="">Selecione a venda</option>
            {vendas.map(v => (
              <option key={v.id} value={v.id}>
                #{v.id} — {v.cliente_nome} — R$ {Number(v.valor_total).toFixed(2)} — {new Date(v.created_at).toLocaleDateString("pt-BR")}
              </option>
            ))}
          </select>
        </div>

        {/* Itens da venda selecionada */}
        {vendaSelecionada && vendaSelecionada.itens?.length > 0 && (
          <div style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "13px", color: "#374151" }}>
              Itens desta venda (informe a quantidade devolvida de cada um):
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {vendaSelecionada.itens.map(item => (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "14px" }}>
                    {item.product_name} — Tam. {item.size} — Qtd. vendida: {item.quantity}
                  </span>
                  <input
                    type="number" min="0" max={item.quantity}
                    style={{ ...s.input, width: "80px" }}
                    placeholder="0"
                    value={itensDevolvidos[item.id] || ""}
                    onChange={e => setItensDevolvidos(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ ...s.row, marginBottom: "16px" }}>
          <div>
            <label style={s.label}>Motivo *</label>
            <input style={s.input} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Produto com defeito" />
          </div>
          <div>
            <label style={s.label}>Valor Devolvido (R$) *</label>
            <input style={s.input} type="number" step="0.01" min="0"
              value={valorDevolvido} onChange={e => setValorDevolvido(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div style={s.formGroup}>
          <label style={s.label}>Observações</label>
          <textarea style={{ ...s.input, minHeight: "64px", resize: "vertical" }}
            value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Informações adicionais..." />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={resetForm} style={{ ...s.btnPrimary, backgroundColor: "#f3f4f6", color: "#374151" }}>Limpar</button>
          <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>
            {salvando ? "Registrando..." : "Registrar Devolução"}
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div style={s.card}>
        <h2 style={{ margin: "0 0 16px", color: "#071633" }}>Histórico de Devoluções</h2>
        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Carregando...</p>
        ) : devolucoes.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Nenhuma devolução registrada ainda.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["#", "Venda", "Cliente", "Vendedor", "Valor Venda", "Valor Devolvido", "Motivo", "Data", ""].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devolucoes.map(d => (
                  <tr key={d.id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={s.td}><span style={{ color: "#6b7280", fontSize: "13px" }}>#{d.id}</span></td>
                    <td style={s.td}><span style={{ color: "#6b7280", fontSize: "13px" }}>#{d.venda_id}</span></td>
                    <td style={s.td}><strong>{d.cliente_nome}</strong></td>
                    <td style={s.td}>{d.vendedor_nome}</td>
                    <td style={s.td}>R$ {d.valor_venda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td style={s.td}><strong style={{ color: "#dc2626" }}>R$ {d.valor_devolvido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></td>
                    <td style={s.td}>{d.motivo}</td>
                    <td style={s.td}><span style={{ fontSize: "13px", color: "#6b7280" }}>{new Date(d.created_at).toLocaleDateString("pt-BR")}</span></td>
                    <td style={s.td}><button style={s.btnDanger} onClick={() => excluir(d.id)}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}