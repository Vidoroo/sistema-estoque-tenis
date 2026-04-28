import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Movimentacao = {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  origem: "venda" | "devolucao" | "manual";
  origem_id: number;
};

type Resumo = {
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  movimentacoes: Movimentacao[];
};

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  page:     { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:    { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle: { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid:     { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string, bg?: string) => ({ backgroundColor: bg || "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card:     { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  toolbar:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  label:    { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  input:    { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  select:   { padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff" } as React.CSSProperties,
  selectFull: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" as const } as React.CSSProperties,
  formGroup: { marginBottom: "16px" } as React.CSSProperties,
  row3:      { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" } as React.CSSProperties,
  btnPrimary: { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger:  { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "12px", fontWeight: 600 } as React.CSSProperties,
  table:  { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:     { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  td:     { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const CATEGORIAS_ENTRADA = ["Venda", "Outros"];
const CATEGORIAS_SAIDA   = ["Devolução", "Aluguel", "Fornecedor", "Salário", "Marketing", "Outros"];

// ── Componente ─────────────────────────────────────────────────────────────────
export default function FluxoCaixa() {
  const [resumo, setResumo]   = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState("");

  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  // Form lançamento manual
  const [tipo, setTipo]           = useState<"entrada" | "saida">("entrada");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor]         = useState("");
  const [categoria, setCategoria] = useState("");

  const anos = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  const carregar = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/fluxo-caixa/?mes=${mes}&ano=${ano}`);
      const json = await res.json();
      setResumo(json.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [mes, ano]);

  const salvarLancamento = async () => {
    if (!descricao.trim()) { alert("Informe a descrição."); return; }
    if (!valor || Number(valor) <= 0) { alert("Informe um valor válido."); return; }

    setSalvando(true);
    try {
      const res = await fetch(`${API_URL}/fluxo-caixa/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, descricao, valor: Number(valor), categoria: categoria || null }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || "Erro ao salvar."); return; }
      setDescricao(""); setValor(""); setCategoria("");
      carregar();
    } catch {
      alert("Erro ao criar lançamento.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirLancamento = async (id: string) => {
    const lancId = id.replace("lanc-", "");
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`${API_URL}/fluxo-caixa/${lancId}`, { method: "DELETE" });
    carregar();
  };

  const movsFiltradas = (resumo?.movimentacoes || []).filter(m =>
    !filtroTipo || m.tipo === filtroTipo
  );

  const saldoPositivo = (resumo?.saldo || 0) >= 0;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Fluxo de Caixa</h1>
      <p style={s.subtitle}>Entradas, saídas e saldo do período.</p>

      {/* Cards */}
      <div style={s.grid}>
        <div style={s.summaryCard("#16a34a", "#f0fdf4")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Entradas</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800, color: "#16a34a" }}>
            R$ {(resumo?.total_entradas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div style={s.summaryCard("#dc2626", "#fef2f2")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Saídas</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800, color: "#dc2626" }}>
            R$ {(resumo?.total_saidas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div style={s.summaryCard(saldoPositivo ? "#2563eb" : "#dc2626", saldoPositivo ? "#eff6ff" : "#fef2f2")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Saldo</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800, color: saldoPositivo ? "#2563eb" : "#dc2626" }}>
            {saldoPositivo ? "+" : ""}R$ {(resumo?.saldo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      {/* Lançamento manual */}
      <div style={s.card}>
        <h2 style={{ margin: "0 0 20px", color: "#071633" }}>Novo Lançamento Manual</h2>

        <div style={{ ...s.row3, marginBottom: "16px" }}>
          <div>
            <label style={s.label}>Tipo *</label>
            <select style={s.selectFull} value={tipo} onChange={e => { setTipo(e.target.value as "entrada" | "saida"); setCategoria(""); }}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Categoria</label>
            <select style={s.selectFull} value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="">Selecione</option>
              {(tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={s.label}>Valor (R$) *</label>
            <input style={s.input} type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div style={{ ...s.formGroup, display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>Descrição *</label>
            <input style={s.input} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva o lançamento..." />
          </div>
          <button style={{ ...s.btnPrimary, whiteSpace: "nowrap" as const }} onClick={salvarLancamento} disabled={salvando}>
            {salvando ? "Salvando..." : `+ Adicionar ${tipo === "entrada" ? "Entrada" : "Saída"}`}
          </button>
        </div>
      </div>

      {/* Movimentações */}
      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Movimentações</h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const }}>
            <select style={s.select} value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todas</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
            <select style={s.select} value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select style={s.select} value={ano} onChange={e => setAno(Number(e.target.value))}>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Carregando...</p>
        ) : movsFiltradas.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Nenhuma movimentação no período.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Tipo", "Descrição", "Categoria", "Valor", "Data", ""].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movsFiltradas.map(m => (
                  <tr key={m.id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={s.td}>
                      <span style={{
                        display: "inline-block", padding: "3px 10px", borderRadius: "999px",
                        fontSize: "12px", fontWeight: 600,
                        backgroundColor: m.tipo === "entrada" ? "#dcfce7" : "#fee2e2",
                        color: m.tipo === "entrada" ? "#16a34a" : "#dc2626",
                      }}>
                        {m.tipo === "entrada" ? "↑ Entrada" : "↓ Saída"}
                      </span>
                    </td>
                    <td style={s.td}>{m.descricao}</td>
                    <td style={s.td}>
                      <span style={{ fontSize: "12px", color: "#6b7280", backgroundColor: "#f3f4f6", padding: "2px 8px", borderRadius: "6px" }}>
                        {m.categoria}
                      </span>
                    </td>
                    <td style={s.td}>
                      <strong style={{ color: m.tipo === "entrada" ? "#16a34a" : "#dc2626" }}>
                        {m.tipo === "entrada" ? "+" : "-"}R$ {m.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td style={s.td}>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>
                        {new Date(m.data).toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td style={s.td}>
                      {m.origem === "manual" && (
                        <button style={s.btnDanger} onClick={() => excluirLancamento(m.id)}>Excluir</button>
                      )}
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