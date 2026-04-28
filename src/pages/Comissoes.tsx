import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Comissao = {
  venda_id: number;
  vendedor_id: number;
  vendedor_nome: string;
  cliente_nome: string;
  valor_venda: number;
  percentual_comissao: number;
  valor_comissao: number;
  comissao_paga: boolean;
  data_venda: string;
};

type Resumo = {
  vendedor_id: number;
  vendedor_nome: string;
  total_vendas: number;
  total_comissao: number;
  comissao_paga: number;
  comissao_pendente: number;
};

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  page:     { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:    { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle: { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid:     { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card:     { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  toolbar:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  select:   { padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff" } as React.CSSProperties,
  table:    { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:       { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  td:       { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
};

function Badge({ paga }: { paga: boolean }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "999px",
      fontSize: "12px", fontWeight: 600,
      backgroundColor: paga ? "#dcfce7" : "#fef9c3",
      color: paga ? "#16a34a" : "#a16207",
    }}>
      {paga ? "Paga" : "Pendente"}
    </span>
  );
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function Comissoes() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [atualizando, setAtualizando] = useState<number | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus)   params.append("status", filtroStatus);
      if (filtroVendedor) params.append("vendedor_id", filtroVendedor);

      const [resC, resR] = await Promise.all([
        fetch(`${API_URL}/comissoes/?${params}`),
        fetch(`${API_URL}/comissoes/resumo`),
      ]);
      const [jC, jR] = await Promise.all([resC.json(), resR.json()]);
      setComissoes(jC.data || []);
      setResumo(jR.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [filtroStatus, filtroVendedor]);

  const togglePagamento = async (vendaId: number, paga: boolean) => {
    setAtualizando(vendaId);
    try {
      await fetch(`${API_URL}/comissoes/${vendaId}/pagar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comissao_paga: !paga }),
      });
      carregar();
    } finally {
      setAtualizando(null);
    }
  };

  const totalPendente = comissoes.filter(c => !c.comissao_paga).reduce((a, c) => a + c.valor_comissao, 0);
  const totalPago     = comissoes.filter(c =>  c.comissao_paga).reduce((a, c) => a + c.valor_comissao, 0);
  const totalGeral    = totalPago + totalPendente;

  const vendedoresUnicos = [...new Map(comissoes.map(c => [c.vendedor_id, { id: c.vendedor_id, nome: c.vendedor_nome }])).values()];

  return (
    <div style={s.page}>
      <h1 style={s.title}>Comissões</h1>
      <p style={s.subtitle}>Controle das comissões por vendedor e status de pagamento.</p>

      {/* Cards */}
      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total Geral</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800 }}>
            R$ {totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div style={s.summaryCard("#a16207")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Pendentes</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800, color: "#a16207" }}>
            R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div style={s.summaryCard("#16a34a")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Pagas</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800, color: "#16a34a" }}>
            R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      {/* Resumo por vendedor */}
      {resumo.length > 0 && (
        <div style={s.card}>
          <h2 style={{ margin: "0 0 16px", color: "#071633" }}>Resumo por Vendedor</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Vendedor", "Vendas", "Total", "Pago", "Pendente"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumo.map(r => (
                  <tr key={r.vendedor_id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={s.td}><strong>{r.vendedor_nome}</strong></td>
                    <td style={s.td}>{r.total_vendas}</td>
                    <td style={s.td}>R$ {r.total_comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td style={s.td}><span style={{ color: "#16a34a", fontWeight: 600 }}>R$ {r.comissao_paga.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></td>
                    <td style={s.td}><span style={{ color: "#a16207", fontWeight: 600 }}>R$ {r.comissao_pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista detalhada */}
      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Comissões</h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const }}>
            <select style={s.select} value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}>
              <option value="">Todos os vendedores</option>
              {vendedoresUnicos.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
            <select style={s.select} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="paga">Pagas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Carregando...</p>
        ) : comissoes.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Nenhuma comissão encontrada.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Venda", "Vendedor", "Cliente", "Valor Venda", "% Comissão", "Valor Comissão", "Status", "Ação"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comissoes.map(c => (
                  <tr key={c.venda_id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={s.td}><span style={{ color: "#6b7280", fontSize: "13px" }}>#{c.venda_id}</span></td>
                    <td style={s.td}><strong>{c.vendedor_nome}</strong></td>
                    <td style={s.td}>{c.cliente_nome}</td>
                    <td style={s.td}>R$ {c.valor_venda.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td style={s.td}>{c.percentual_comissao.toFixed(1)}%</td>
                    <td style={s.td}><strong>R$ {c.valor_comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></td>
                    <td style={s.td}><Badge paga={c.comissao_paga} /></td>
                    <td style={s.td}>
                      <button
                        disabled={atualizando === c.venda_id}
                        onClick={() => togglePagamento(c.venda_id, c.comissao_paga)}
                        style={{
                          padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", border: "none",
                          backgroundColor: c.comissao_paga ? "#fee2e2" : "#dcfce7",
                          color: c.comissao_paga ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {atualizando === c.venda_id ? "..." : c.comissao_paga ? "Desmarcar" : "Marcar Paga"}
                      </button>
                    </td>
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