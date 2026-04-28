import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Vendedor = {
  id: number;
  nome: string;
  meta_mensal: number;
  percentual_comissao: number;
  status: string;
};

type Venda = {
  vendedor_id: number;
  valor_total: number;
  created_at: string;
};

type MetaVendedor = Vendedor & {
  vendido_mes: number;
  percentual_atingido: number;
  atingiu: boolean;
};

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  page:     { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:    { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle: { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid:     { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card:     { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  toolbar:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  select:   { padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff" } as React.CSSProperties,
};

function ProgressBar({ pct, atingiu }: { pct: number; atingiu: boolean }) {
  const fill = Math.min(pct, 100);
  const cor  = atingiu ? "#16a34a" : pct >= 75 ? "#2563eb" : pct >= 50 ? "#f59e0b" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
        <div style={{ width: `${fill}%`, backgroundColor: cor, height: "100%", borderRadius: "999px", transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700, color: cor, minWidth: "44px" }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function Metas() {
  const [metas, setMetas]       = useState<MetaVendedor[]>([]);
  const [loading, setLoading]   = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState(() => new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(() => new Date().getFullYear());

  const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const carregar = async () => {
    setLoading(true);
    try {
      const [resV, resVendas] = await Promise.all([
        fetch(`${API_URL}/vendedores/`),
        fetch(`${API_URL}/vendas/`),
      ]);
      const [jV, jVendas] = await Promise.all([resV.json(), resVendas.json()]);

      const vendedores: Vendedor[] = jV.data || [];
      const vendas: Venda[]        = jVendas.data || [];

      // Filtra vendas do mês/ano selecionado
      const vendasFiltradas = vendas.filter(v => {
        const d = new Date(v.created_at);
        return d.getMonth() + 1 === mesSelecionado && d.getFullYear() === anoSelecionado;
      });

      const resultado: MetaVendedor[] = vendedores
        .filter(v => v.status === "Ativo")
        .map(v => {
          const vendido = vendasFiltradas
            .filter(vn => vn.vendedor_id === v.id)
            .reduce((acc, vn) => acc + Number(vn.valor_total || 0), 0);

          const meta = Number(v.meta_mensal || 0);
          const pct  = meta > 0 ? (vendido / meta) * 100 : 0;

          return {
            ...v,
            vendido_mes:         vendido,
            percentual_atingido: pct,
            atingiu:             vendido >= meta && meta > 0,
          };
        })
        .sort((a, b) => b.percentual_atingido - a.percentual_atingido);

      setMetas(resultado);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [mesSelecionado, anoSelecionado]);

  const atingiram   = metas.filter(m => m.atingiu).length;
  const mediaGeral  = metas.length > 0 ? metas.reduce((a, m) => a + m.percentual_atingido, 0) / metas.length : 0;
  const totalVendido = metas.reduce((a, m) => a + m.vendido_mes, 0);

  const anos = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div style={s.page}>
      <h1 style={s.title}>Metas</h1>
      <p style={s.subtitle}>Acompanhamento das metas comerciais dos vendedores.</p>

      {/* Cards */}
      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Vendedores Ativos</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{metas.length}</h2>
        </div>
        <div style={s.summaryCard("#16a34a")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Metas Atingidas</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800, color: "#16a34a" }}>
            {atingiram} <span style={{ fontSize: "1rem", color: "#6b7280" }}>/ {metas.length}</span>
          </h2>
        </div>
        <div style={s.summaryCard("#2563eb")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Média Geral</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800, color: "#2563eb" }}>
            {mediaGeral.toFixed(0)}%
          </h2>
        </div>
        <div style={s.summaryCard("#7c3aed")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total Vendido no Mês</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.5rem", fontWeight: 800 }}>
            R$ {totalVendido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      {/* Tabela de metas */}
      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Desempenho por Vendedor</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <select style={s.select} value={mesSelecionado} onChange={e => setMesSelecionado(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select style={s.select} value={anoSelecionado} onChange={e => setAnoSelecionado(Number(e.target.value))}>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Carregando...</p>
        ) : metas.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Nenhum vendedor ativo encontrado.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {metas.map(m => (
              <div key={m.id} style={{
                border: "1px solid #e5e7eb", borderRadius: "10px", padding: "18px",
                backgroundColor: m.atingiu ? "#f0fdf4" : "#fff",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap" as const, gap: "8px" }}>
                  <div>
                    <strong style={{ fontSize: "15px" }}>{m.nome}</strong>
                    {m.atingiu && (
                      <span style={{ marginLeft: "8px", fontSize: "12px", backgroundColor: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 }}>
                        ✓ Meta Atingida
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" as const, fontSize: "13px", color: "#6b7280" }}>
                    <div>Vendido: <strong style={{ color: "#071633" }}>R$ {m.vendido_mes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                    <div>Meta: R$ {Number(m.meta_mensal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
                <ProgressBar pct={m.percentual_atingido} atingiu={m.atingiu} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}