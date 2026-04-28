import { useEffect, useState } from "react";

type Product = {
  id: number;
  codigo: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  preco_varejo: number;
  preco_atacado: number;
  image: string;
  tamanhos: Record<string, string>;
  fornecedor: string | null;
};

const API_URL = "http://127.0.0.1:5000/api";

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  page:     { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:    { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle: { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid:     { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card:     { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  toolbar:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  input:    { padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", width: "260px" } as React.CSSProperties,
  inputFull:{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  label:    { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  fg:       { marginBottom: "14px" } as React.CSSProperties,
  formRow:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } as React.CSSProperties,
  btnPrimary: { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger:  { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  btnEdit:    { backgroundColor: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  td: { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
  overlay: { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modal: { backgroundColor: "#fff", borderRadius: "14px", padding: "32px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } as React.CSSProperties,
};

export default function Produtos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [busca, setBusca]       = useState("");
  const [loading, setLoading]   = useState(true);

  // Modal edição
  const [editando, setEditando]     = useState<Product | null>(null);
  const [formName, setFormName]     = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPrice, setFormPrice]   = useState("");
  const [formVarejo, setFormVarejo] = useState("");
  const [formAtacado, setFormAtacado] = useState("");
  const [formImage, setFormImage]   = useState("");
  const [salvando, setSalvando]     = useState(false);

  useEffect(() => { carregarProdutos(); }, []);

  async function carregarProdutos() {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/products/`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setProducts(data.data || []);
    } catch (e: any) {
      alert(e.message || "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(id: number) {
    if (!confirm("Deseja excluir este produto?")) return;
    try {
      const res  = await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      alert(e.message || "Erro ao excluir produto.");
    }
  }

  function abrirEdicao(p: Product) {
    setEditando(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(String(p.price));
    setFormVarejo(String(p.preco_varejo || ""));
    setFormAtacado(String(p.preco_atacado || ""));
    setFormImage(p.image || "");
  }

  function fecharModal() {
    setEditando(null);
  }

  async function salvarEdicao() {
    if (!editando) return;
    if (!formName.trim() || !formPrice) { alert("Nome e preço são obrigatórios."); return; }
    setSalvando(true);
    try {
      const res = await fetch(`${API_URL}/products/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:              formName.trim(),
          category:          formCategory.trim(),
          price:             Number(formPrice),
          preco_varejo:      Number(formVarejo) || 0,
          preco_atacado:     Number(formAtacado) || 0,
          image:             formImage.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await carregarProdutos();
      fecharModal();
    } catch (e: any) {
      alert(e.message || "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const produtosFiltrados = products.filter(p =>
    p.name.toLowerCase().includes(busca.toLowerCase()) ||
    p.category?.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busca.toLowerCase())
  );

  // Métricas
  const totalProdutos   = products.length;
  const semEstoque      = products.filter(p => p.quantity === 0).length;
  const estoqueMinimo   = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
  const totalEmEstoque  = products.reduce((a, p) => a + p.quantity, 0);

  return (
    <div style={s.page}>
      <h1 style={s.title}>Produtos</h1>
      <p style={s.subtitle}>Gerencie o catálogo de tênis do estoque.</p>

      {/* Cards de resumo */}
      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total de Produtos</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{totalProdutos}</h2>
        </div>
        <div style={s.summaryCard("#16a34a")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total em Estoque</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{totalEmEstoque}</h2>
        </div>
        <div style={s.summaryCard("#f59e0b")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Estoque Baixo</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800, color: "#f59e0b" }}>{estoqueMinimo}</h2>
        </div>
        <div style={s.summaryCard("#dc2626")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Sem Estoque</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800, color: "#dc2626" }}>{semEstoque}</h2>
        </div>
      </div>

      {/* Tabela */}
      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Produtos</h2>
          <input
            style={s.input}
            placeholder="Buscar por nome, categoria, código..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>Carregando...</p>
        ) : produtosFiltrados.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>
            {busca ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Produto", "Código", "Categoria", "Preço", "Tamanhos", "Estoque", "Ações"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map(p => {
                  const tamanhos = Object.entries(p.tamanhos || {}).filter(([, q]) => Number(q) > 0);
                  const estoqueStatus = p.quantity === 0
                    ? { cor: "#dc2626", bg: "#fee2e2", texto: "Sem estoque" }
                    : p.quantity < 10
                    ? { cor: "#d97706", bg: "#fef3c7", texto: `${p.quantity} un.` }
                    : { cor: "#16a34a", bg: "#dcfce7", texto: `${p.quantity} un.` };

                  return (
                    <tr
                      key={p.id}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      style={{ transition: "background 0.15s" }}
                    >
                      {/* Produto com imagem */}
                      <td style={s.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div style={{ width: "44px", height: "44px", borderRadius: "8px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                              👟
                            </div>
                          )}
                          <strong style={{ fontSize: "14px" }}>{p.name}</strong>
                        </div>
                      </td>

                      <td style={s.td}>
                        <span style={{ fontFamily: "monospace", fontSize: "13px", backgroundColor: "#f3f4f6", padding: "2px 8px", borderRadius: "4px" }}>
                          {p.codigo || "—"}
                        </span>
                      </td>

                      <td style={s.td}>{p.category || "—"}</td>

                      <td style={s.td}>
                        <div style={{ fontSize: "13px" }}>
                          <div style={{ fontWeight: 700 }}>R$ {Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                          {p.preco_varejo > 0 && (
                            <div style={{ color: "#6b7280", fontSize: "11px" }}>
                              Varejo: R$ {Number(p.preco_varejo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tamanhos disponíveis */}
                      <td style={s.td}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "200px" }}>
                          {tamanhos.length > 0 ? tamanhos.map(([t, q]) => (
                            <span key={t} style={{
                              padding: "2px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
                              backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
                            }}>
                              {t}
                              <span style={{ opacity: 0.7, marginLeft: "2px" }}>({q})</span>
                            </span>
                          )) : (
                            <span style={{ color: "#dc2626", fontSize: "12px" }}>Sem estoque</span>
                          )}
                        </div>
                      </td>

                      {/* Badge de estoque total */}
                      <td style={s.td}>
                        <span style={{
                          display: "inline-block", padding: "4px 10px", borderRadius: "999px",
                          fontSize: "12px", fontWeight: 600,
                          backgroundColor: estoqueStatus.bg, color: estoqueStatus.cor,
                        }}>
                          {estoqueStatus.texto}
                        </span>
                      </td>

                      <td style={s.td}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button style={s.btnEdit} onClick={() => abrirEdicao(p)}>Editar</button>
                          <button style={s.btnDanger} onClick={() => excluirProduto(p.id)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal edição */}
      {editando && (
        <div style={s.overlay} onClick={fecharModal}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", color: "#071633" }}>Editar Produto</h2>

            <div style={s.fg}>
              <label style={s.label}>Nome do Produto *</label>
              <input style={s.inputFull} value={formName} onChange={e => setFormName(e.target.value)} />
            </div>

            <div style={s.fg}>
              <label style={s.label}>Categoria</label>
              <input style={s.inputFull} value={formCategory} onChange={e => setFormCategory(e.target.value)} />
            </div>

            <div style={{ ...s.fg, ...s.formRow }}>
              <div>
                <label style={s.label}>Preço de Custo (R$)</label>
                <input style={s.inputFull} type="number" step="0.01" min="0" value={formPrice} onChange={e => setFormPrice(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Preço Varejo (R$)</label>
                <input style={s.inputFull} type="number" step="0.01" min="0" value={formVarejo} onChange={e => setFormVarejo(e.target.value)} />
              </div>
            </div>

            <div style={s.fg}>
              <label style={s.label}>Preço Atacado (R$)</label>
              <input style={s.inputFull} type="number" step="0.01" min="0" value={formAtacado} onChange={e => setFormAtacado(e.target.value)} />
            </div>

            <div style={s.fg}>
              <label style={s.label}>URL da Imagem</label>
              <input style={s.inputFull} value={formImage} onChange={e => setFormImage(e.target.value)} placeholder="https://..." />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button onClick={fecharModal} style={{ ...s.btnPrimary, backgroundColor: "#f3f4f6", color: "#374151" }}>
                Cancelar
              </button>
              <button style={s.btnPrimary} onClick={salvarEdicao} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}