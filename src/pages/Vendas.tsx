import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Cliente = { id: number; nome: string };
type Vendedor = { id: number; nome: string; percentual_comissao?: number };
type Produto = { id: number; name: string; price: number; tamanhos: Record<string, string> };

type ItemVenda = { product_id: number; size: string; quantity: number };
type ItemDisplay = ItemVenda & { nome: string; preco: number };

type Venda = {
  id: number;
  cliente_nome: string;
  vendedor_nome: string;
  valor_total: number;
  percentual_comissao: number;
  valor_comissao: number;
  created_at: string;
  itens?: { product_name: string; size: string; quantity: number; unit_price: number; subtotal: number }[];
};

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  page: { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title: { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle: { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card: { backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" } as React.CSSProperties,
  label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  select: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" as const } as React.CSSProperties,
  input: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  formGroup: { marginBottom: "16px" } as React.CSSProperties,
  btnPrimary: { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnSecondary: { backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger: { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  btnSuccess: { backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 28px", cursor: "pointer", fontWeight: 700, fontSize: "15px" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  td: { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
};

// ── Componente principal ───────────────────────────────────────────────────────
export default function Vendas() {
  // Dados de suporte
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Formulário de nova venda
  const [clienteId, setClienteId] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemDisplay[]>([]);

  // Formulário de item
  const [produtoId, setProdutoId] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  // ── Carregar dados ───────────────────────────────────────────────────────────
  const carregarTudo = async () => {
    setLoading(true);
    try {
      const [resC, resV, resP, resVendas] = await Promise.all([
        fetch(`${API_URL}/clientes`),
        fetch(`${API_URL}/vendedores/`),
        fetch(`${API_URL}/products/`),
        fetch(`${API_URL}/vendas/`),
      ]);
      const [jC, jV, jP, jVendas] = await Promise.all([resC.json(), resV.json(), resP.json(), resVendas.json()]);

      setClientes(Array.isArray(jC) ? jC : jC.data || []);
      setVendedores(jV.data || []);
      setProdutos(jP.data || []);
      setVendas(jVendas.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarTudo(); }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const produtoSelecionado = produtos.find((p) => String(p.id) === produtoId);
  const vendedorSelecionado = vendedores.find((v) => String(v.id) === vendedorId);

  const tamanhosDisponiveis = produtoSelecionado
    ? Object.entries(produtoSelecionado.tamanhos || {}).filter(([, qtd]) => Number(qtd) > 0)
    : [];

  const subtotalItens = itens.reduce((acc, item) => acc + item.preco * item.quantity, 0);
  const comissaoEstimada = subtotalItens * (Number(vendedorSelecionado?.percentual_comissao || 0) / 100);

  // ── Adicionar item à venda ───────────────────────────────────────────────────
  const adicionarItem = () => {
    if (!produtoId || !size || quantity <= 0) {
      alert("Selecione produto, tamanho e quantidade.");
      return;
    }

    const produto = produtos.find((p) => String(p.id) === produtoId)!;
    const estoqueDisponivel = Number(produto.tamanhos?.[size] || 0);

    if (quantity > estoqueDisponivel) {
      alert(`Estoque insuficiente. Disponível: ${estoqueDisponivel}`);
      return;
    }

    // Verifica se item já existe (mesmo produto + tamanho)
    const existe = itens.findIndex((i) => i.product_id === Number(produtoId) && i.size === size);
    if (existe >= 0) {
      const novos = [...itens];
      novos[existe].quantity += quantity;
      setItens(novos);
    } else {
      setItens((prev) => [
        ...prev,
        { product_id: Number(produtoId), size, quantity, nome: produto.name, preco: produto.price },
      ]);
    }

    setProdutoId("");
    setSize("");
    setQuantity(1);
  };

  const removerItem = (index: number) => setItens((prev) => prev.filter((_, i) => i !== index));

  // ── Finalizar venda ──────────────────────────────────────────────────────────
  const salvarVenda = async () => {
    if (!clienteId) { alert("Selecione o cliente."); return; }
    if (!vendedorId) { alert("Selecione o vendedor."); return; }
    if (itens.length === 0) { alert("Adicione pelo menos um item."); return; }

    setSalvando(true);
    try {
      const res = await fetch(`${API_URL}/vendas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: Number(clienteId),
          vendedor_id: Number(vendedorId),
          observacoes,
          itens: itens.map(({ product_id, size, quantity }) => ({ product_id, size, quantity })),
        }),
      });

      const json = await res.json();
      if (!res.ok) { alert(json.message || "Erro ao salvar venda."); return; }

      // Reset do formulário
      setClienteId("");
      setVendedorId("");
      setObservacoes("");
      setItens([]);
      setProdutoId("");
      setSize("");
      setQuantity(1);

      carregarTudo();
    } catch {
      alert("Erro ao registrar venda.");
    } finally {
      setSalvando(false);
    }
  };

  // ── Métricas ─────────────────────────────────────────────────────────────────
  const totalFaturado = vendas.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
  const totalComissoes = vendas.reduce((acc, v) => acc + Number(v.valor_comissao || 0), 0);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <h1 style={s.title}>Vendas</h1>
      <p style={s.subtitle}>Registro de vendas e histórico de transações.</p>

      {/* Cards de resumo */}
      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total de Vendas</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{vendas.length}</h2>
        </div>
        <div style={s.summaryCard("#16a34a")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total Faturado</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800 }}>
            R$ {totalFaturado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div style={s.summaryCard("#2563eb")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total em Comissões</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "1.6rem", fontWeight: 800 }}>
            R$ {totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      {/* ── Formulário de nova venda ── */}
      <div style={s.card}>
        <h2 style={{ margin: "0 0 20px", color: "#071633" }}>Nova Venda</h2>

        {/* Cliente e Vendedor */}
        <div style={{ ...s.row, marginBottom: "16px" }}>
          <div>
            <label style={s.label}>Cliente *</label>
            <select style={s.select} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecione o cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={s.label}>Vendedor *</label>
            <select style={s.select} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
              <option value="">Selecione o vendedor</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nome} ({Number(v.percentual_comissao || 0).toFixed(1)}%)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Adicionar item */}
        <div style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "14px", color: "#374151" }}>Adicionar Item</p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "flex-end" }}>
            <div>
              <label style={s.label}>Produto</label>
              <select style={s.select} value={produtoId} onChange={(e) => { setProdutoId(e.target.value); setSize(""); }}>
                <option value="">Selecione o produto</option>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toFixed(2)}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Tamanho</label>
              <select style={s.select} value={size} onChange={(e) => setSize(e.target.value)} disabled={!produtoId}>
                <option value="">Tamanho</option>
                {tamanhosDisponiveis.map(([tam, qtd]) => (
                  <option key={tam} value={tam}>{tam} (est. {qtd})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={s.label}>Qtd.</label>
              <input style={s.input} type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <button style={{ ...s.btnPrimary, whiteSpace: "nowrap" as const }} onClick={adicionarItem}>
              + Adicionar
            </button>
          </div>
        </div>

        {/* Lista de itens */}
        {itens.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontWeight: 600, fontSize: "14px", color: "#374151", marginBottom: "8px" }}>Itens da venda</p>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Produto", "Tamanho", "Qtd.", "Preço Unit.", "Subtotal", ""].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itens.map((item, index) => (
                  <tr key={index}>
                    <td style={s.td}>{item.nome}</td>
                    <td style={s.td}>{item.size}</td>
                    <td style={s.td}>{item.quantity}</td>
                    <td style={s.td}>R$ {Number(item.preco).toFixed(2)}</td>
                    <td style={s.td}><strong>R$ {(item.preco * item.quantity).toFixed(2)}</strong></td>
                    <td style={s.td}>
                      <button style={s.btnDanger} onClick={() => removerItem(index)}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Resumo + observações + botão */}
        <div style={{ ...s.row, alignItems: "flex-end" }}>
          <div>
            <label style={s.label}>Observações</label>
            <textarea
              style={{ ...s.input, minHeight: "72px", resize: "vertical" }}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>
          <div style={{ backgroundColor: "#f0fdf4", borderRadius: "10px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px" }}>
              <span style={{ color: "#6b7280" }}>Subtotal:</span>
              <strong>R$ {subtotalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
            </div>
            {vendedorSelecionado && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px" }}>
                <span style={{ color: "#6b7280" }}>Comissão estimada ({Number(vendedorSelecionado.percentual_comissao || 0).toFixed(1)}%):</span>
                <strong style={{ color: "#2563eb" }}>R$ {comissaoEstimada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </div>
            )}
            <button style={s.btnSuccess} onClick={salvarVenda} disabled={salvando}>
              {salvando ? "Registrando..." : "✓ Finalizar Venda"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Histórico ── */}
      <div style={s.card}>
        <h2 style={{ margin: "0 0 16px", color: "#071633" }}>Histórico de Vendas</h2>

        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Carregando...</p>
        ) : vendas.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Nenhuma venda registrada ainda.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["#", "Cliente", "Vendedor", "Total", "% Comissão", "Comissão", "Data"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => (
                  <tr
                    key={v.id}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={s.td}><span style={{ color: "#6b7280", fontSize: "13px" }}>#{v.id}</span></td>
                    <td style={s.td}><strong>{v.cliente_nome}</strong></td>
                    <td style={s.td}>{v.vendedor_nome}</td>
                    <td style={s.td}>
                      <strong style={{ color: "#16a34a" }}>
                        R$ {Number(v.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td style={s.td}>{Number(v.percentual_comissao).toFixed(1)}%</td>
                    <td style={s.td}>R$ {Number(v.valor_comissao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td style={s.td}>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>
                        {new Date(v.created_at).toLocaleString("pt-BR")}
                      </span>
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