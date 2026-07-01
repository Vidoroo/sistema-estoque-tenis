import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "https://sistema-estoque-tenis-backend.onrender.com/api";

// -- Tipos
type Produto = {
  id: number;
  name: string;
  category: string;
  preco_varejo: number;
  preco_atacado: number;
  preco_dropshipping: number;
  tamanhos: Record<string, string>;
  quantity: number;
  image: string;
};

type Cliente = {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
};

type ItemVenda = {
  product_id: number;
  nome: string;
  size: string;
  quantity: number;
  unit_price: number;
};

type VendaHistorico = {
  id: number;
  cliente_nome: string;
  valor_total: number;
  percentual_comissao: number;
  valor_comissao: number;
  created_at: string;
};

// -- Helpers
function fmt(v: number) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// -- Estilos
const s = {
  page:         { fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f8fafc" } as React.CSSProperties,
  header:       { backgroundColor: "#071633", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" } as React.CSSProperties,
  body:         { padding: "24px", maxWidth: "1100px", margin: "0 auto" } as React.CSSProperties,
  card:         { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  tabs:         { display: "flex", gap: "8px", marginBottom: "24px" } as React.CSSProperties,
  tab:          (ativo: boolean) => ({ padding: "10px 20px", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", border: "none", backgroundColor: ativo ? "#071633" : "#f3f4f6", color: ativo ? "#fff" : "#374151" } as React.CSSProperties),
  input:        { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  select:       { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" as const } as React.CSSProperties,
  label:        { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  fg:           { marginBottom: "14px" } as React.CSSProperties,
  btnPrimary:   { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnSecondary: { backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnSuccess:   { backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 28px", cursor: "pointer", fontWeight: 700, fontSize: "15px" } as React.CSSProperties,
  btnDanger:    { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  table:        { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:           { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const } as React.CSSProperties,
  td:           { padding: "12px", borderBottom: "1px solid #f3f4f6" } as React.CSSProperties,
  overlay:      { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modal:        { backgroundColor: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } as React.CSSProperties,
};

export default function VendedorPortal() {
  const { token }    = useParams<{ token: string }>();
  const navigate     = useNavigate();
  const vendedorNome = localStorage.getItem("vendedor_nome") || "Vendedor";

  const [aba, setAba] = useState<"produtos" | "clientes" | "vendas">("produtos");

  // -- Dados compartilhados
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendas, setVendas]     = useState<VendaHistorico[]>([]);
  const [busca, setBusca]       = useState("");
  const [loading, setLoading]   = useState(false);

  // -- Modal novo cliente
  const [modalCliente, setModalCliente] = useState(false);
  const [formNome, setFormNome]         = useState("");
  const [formTel, setFormTel]           = useState("");
  const [formEmail, setFormEmail]       = useState("");
  const [formCidade, setFormCidade]     = useState("");
  const [salvando, setSalvando]         = useState(false);

  // -- Formulario de venda
  const [clienteVendaId, setClienteVendaId] = useState("");
  const [itens, setItens]                   = useState<ItemVenda[]>([]);
  const [produtoId, setProdutoId]           = useState("");
  const [size, setSize]                     = useState("");
  const [quantity, setQuantity]             = useState(1);
  const [obsVenda, setObsVenda]             = useState("");
  const [salvandoVenda, setSalvandoVenda]   = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "X-Vendedor-Token": token || "",
  };

  useEffect(() => {
    const t = localStorage.getItem("vendedor_token");
    if (!t || t !== token) { navigate(`/vendedor/${token}`); return; }
    carregar();
  }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const [rP, rC, rV] = await Promise.all([
        fetch(`${API_URL}/vendedor-auth/produtos`, { headers }),
        fetch(`${API_URL}/vendedor-auth/clientes`, { headers }),
        fetch(`${API_URL}/vendedor-auth/vendas`,   { headers }),
      ]);
      const [jP, jC, jV] = await Promise.all([rP.json(), rC.json(), rV.json()]);
      setProdutos(jP.data || []);
      setClientes(jC.data || []);
      setVendas(jV.data   || []);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("vendedor_token");
    localStorage.removeItem("vendedor_id");
    localStorage.removeItem("vendedor_nome");
    navigate(`/vendedor/${token}`);
  };

  // -- Criar cliente
  const criarCliente = async () => {
    if (!formNome.trim()) { alert("Nome e obrigatorio."); return; }
    setSalvando(true);
    try {
      const res = await fetch(`${API_URL}/vendedor-auth/clientes`, {
        method: "POST",
        headers,
        body: JSON.stringify({ nome: formNome, telefone: formTel || null, email: formEmail || null, cidade: formCidade || null }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || "Erro ao cadastrar."); return; }
      setModalCliente(false);
      setFormNome(""); setFormTel(""); setFormEmail(""); setFormCidade("");
      carregar();
    } finally {
      setSalvando(false);
    }
  };

  // -- Logica de venda
  const produtoSelecionado = produtos.find(p => String(p.id) === produtoId);
  const tamanhosDisponiveis = produtoSelecionado
    ? Object.entries(produtoSelecionado.tamanhos || {}).filter(([, q]) => Number(q) > 0)
    : [];

  const adicionarItem = () => {
    if (!produtoId || !size || quantity <= 0) { alert("Selecione produto, tamanho e quantidade."); return; }

    const produto = produtos.find(p => String(p.id) === produtoId)!;
    const estoqueSize = Number(produto.tamanhos?.[size] || 0);
    if (quantity > estoqueSize) { alert(`Estoque insuficiente. Disponivel: ${estoqueSize}`); return; }

    const existe = itens.findIndex(i => i.product_id === Number(produtoId) && i.size === size);
    if (existe >= 0) {
      const novos = [...itens];
      novos[existe].quantity += quantity;
      setItens(novos);
    } else {
      setItens(prev => [...prev, {
        product_id: Number(produtoId),
        nome: produto.name,
        size,
        quantity,
        unit_price: produto.preco_varejo,
      }]);
    }
    setProdutoId(""); setSize(""); setQuantity(1);
  };

  const removerItem = (index: number) => setItens(prev => prev.filter((_, i) => i !== index));

  const subtotal = itens.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);

  const finalizarVenda = async () => {
    if (!clienteVendaId) { alert("Selecione o cliente."); return; }
    if (itens.length === 0) { alert("Adicione pelo menos um item."); return; }

    setSalvandoVenda(true);
    try {
      const res = await fetch(`${API_URL}/vendedor-auth/vendas`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cliente_id: Number(clienteVendaId),
          observacoes: obsVenda || null,
          itens: itens.map(({ product_id, size, quantity }) => ({ product_id, size, quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || "Erro ao registrar venda."); return; }

      // Reset formulario
      setClienteVendaId(""); setItens([]); setProdutoId(""); setSize(""); setQuantity(1); setObsVenda("");
      carregar();
      alert("Venda registrada com sucesso!");
    } catch {
      alert("Erro ao registrar venda.");
    } finally {
      setSalvandoVenda(false);
    }
  };

  // -- Filtros por aba
  const produtosFiltrados = produtos.filter(p => p.name.toLowerCase().includes(busca.toLowerCase()));
  const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <span style={{ fontSize: "20px", fontWeight: 800 }}>Portal do Vendedor</span>
          <span style={{ marginLeft: "12px", fontSize: "14px", opacity: 0.8 }}>Ola, {vendedorNome}!</span>
        </div>
        <button onClick={logout} style={{ ...s.btnSecondary, fontSize: "13px", padding: "7px 14px" }}>Sair</button>
      </header>

      <div style={s.body}>
        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(aba === "produtos")} onClick={() => { setAba("produtos"); setBusca(""); }}>
            Produtos ({produtos.length})
          </button>
          <button style={s.tab(aba === "clientes")} onClick={() => { setAba("clientes"); setBusca(""); }}>
            Meus Clientes ({clientes.length})
          </button>
          <button style={s.tab(aba === "vendas")} onClick={() => { setAba("vendas"); setBusca(""); }}>
            Vendas ({vendas.length})
          </button>
        </div>

        {/* Busca — so nas abas produtos e clientes */}
        {aba !== "vendas" && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              style={{ ...s.input, maxWidth: "320px" }}
              placeholder={aba === "produtos" ? "Buscar produto..." : "Buscar cliente..."}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {aba === "clientes" && (
              <button style={s.btnPrimary} onClick={() => setModalCliente(true)}>+ Novo Cliente</button>
            )}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>Carregando...</p>
        ) : aba === "produtos" ? (

          /* -- Aba Produtos -- */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {produtosFiltrados.length === 0 ? (
              <p style={{ color: "#6b7280", gridColumn: "1/-1", textAlign: "center", padding: "32px" }}>Nenhum produto encontrado.</p>
            ) : produtosFiltrados.map(p => {
              const tamanhosDispo = Object.entries(p.tamanhos || {}).filter(([, q]) => Number(q) > 0);
              return (
                <div key={p.id} style={s.card}>
                  {p.image && (
                    <img src={p.image} alt={p.name} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px" }} />
                  )}
                  <h3 style={{ margin: "0 0 10px", fontSize: "15px", color: "#071633" }}>{p.name}</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
                    {p.preco_dropshipping > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#7c3aed", fontWeight: 600 }}>Drop</span>
                        <span style={{ color: "#7c3aed", fontWeight: 700 }}>R$ {fmt(p.preco_dropshipping)}</span>
                      </div>
                    )}
                    {p.preco_atacado > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#b45309", fontWeight: 600 }}>Atacado</span>
                        <span style={{ color: "#b45309", fontWeight: 700 }}>R$ {fmt(p.preco_atacado)}</span>
                      </div>
                    )}
                    {p.preco_varejo > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>Varejo</span>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>R$ {fmt(p.preco_varejo)}</span>
                      </div>
                    )}
                  </div>

                  {tamanhosDispo.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {tamanhosDispo.map(([t, q]) => (
                        <span key={t} style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, backgroundColor: "#f0f9ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                          {t} <span style={{ opacity: 0.6 }}>({q})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: "12px", color: "#dc2626", fontWeight: 600 }}>Sem estoque disponivel</p>
                  )}
                </div>
              );
            })}
          </div>

        ) : aba === "clientes" ? (

          /* -- Aba Clientes -- */
          <div style={s.card}>
            {clientesFiltrados.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>
                {busca ? "Nenhum cliente encontrado." : "Voce ainda nao cadastrou nenhum cliente."}
              </p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Nome", "Telefone", "E-mail", "Cidade"].map(h => <th key={h} style={s.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map(c => (
                    <tr key={c.id}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      style={{ transition: "background 0.15s" }}
                    >
                      <td style={s.td}><strong>{c.nome}</strong></td>
                      <td style={s.td}>{c.telefone ?? "-"}</td>
                      <td style={s.td}>{c.email ?? "-"}</td>
                      <td style={s.td}>{c.cidade ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        ) : (

          /* -- Aba Vendas -- */
          <>
            {/* Formulario nova venda */}
            <div style={s.card}>
              <h2 style={{ margin: "0 0 20px", color: "#071633" }}>Nova Venda</h2>

              <div style={s.fg}>
                <label style={s.label}>Cliente *</label>
                <select style={s.select} value={clienteVendaId} onChange={e => setClienteVendaId(e.target.value)}>
                  <option value="">Selecione o cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {clientes.length === 0 && (
                  <p style={{ fontSize: "12px", color: "#f59e0b", marginTop: "4px" }}>
                    Nenhum cliente cadastrado. Cadastre um cliente na aba "Meus Clientes".
                  </p>
                )}
              </div>

              {/* Adicionar item */}
              <div style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "14px", color: "#374151" }}>Adicionar Item</p>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "10px", alignItems: "flex-end" }}>
                  <div>
                    <label style={s.label}>Produto</label>
                    <select style={s.select} value={produtoId} onChange={e => { setProdutoId(e.target.value); setSize(""); }}>
                      <option value="">Selecione o produto</option>
                      {produtos.map(p => <option key={p.id} value={p.id}>{p.name} — R$ {fmt(p.preco_varejo)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Tamanho</label>
                    <select style={s.select} value={size} onChange={e => setSize(e.target.value)} disabled={!produtoId}>
                      <option value="">Tamanho</option>
                      {tamanhosDisponiveis.map(([tam, qtd]) => (
                        <option key={tam} value={tam}>{tam} (est. {qtd})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Qtd.</label>
                    <input style={s.input} type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
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
                        {["Produto", "Tamanho", "Qtd.", "Preco Unit.", "Subtotal", ""].map(h => <th key={h} style={s.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item, index) => (
                        <tr key={index}>
                          <td style={s.td}>{item.nome}</td>
                          <td style={s.td}>{item.size}</td>
                          <td style={s.td}>{item.quantity}</td>
                          <td style={s.td}>R$ {fmt(item.unit_price)}</td>
                          <td style={s.td}><strong>R$ {fmt(item.unit_price * item.quantity)}</strong></td>
                          <td style={s.td}>
                            <button style={s.btnDanger} onClick={() => removerItem(index)}>Remover</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Resumo e finalizar */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "flex-end" }}>
                <div>
                  <label style={s.label}>Observacoes</label>
                  <textarea
                    style={{ ...s.input, minHeight: "72px", resize: "vertical" }}
                    value={obsVenda}
                    onChange={e => setObsVenda(e.target.value)}
                    placeholder="Informacoes adicionais..."
                  />
                </div>
                <div style={{ backgroundColor: "#f0fdf4", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "15px" }}>
                    <span style={{ color: "#6b7280" }}>Subtotal:</span>
                    <strong>R$ {fmt(subtotal)}</strong>
                  </div>
                  <button style={s.btnSuccess} onClick={finalizarVenda} disabled={salvandoVenda}>
                    {salvandoVenda ? "Registrando..." : "Finalizar Venda"}
                  </button>
                </div>
              </div>
            </div>

            {/* Historico de vendas */}
            <div style={s.card}>
              <h2 style={{ margin: "0 0 16px", color: "#071633" }}>Historico de Vendas</h2>
              {vendas.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Nenhuma venda registrada ainda.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {["#", "Cliente", "Total", "Comissao", "Data"].map(h => <th key={h} style={s.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.map(v => (
                        <tr key={v.id}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                          style={{ transition: "background 0.15s" }}
                        >
                          <td style={s.td}><span style={{ color: "#6b7280" }}>#{v.id}</span></td>
                          <td style={s.td}><strong>{v.cliente_nome}</strong></td>
                          <td style={s.td}><strong style={{ color: "#16a34a" }}>R$ {fmt(v.valor_total)}</strong></td>
                          <td style={s.td}>R$ {fmt(v.valor_comissao)} ({Number(v.percentual_comissao).toFixed(1)}%)</td>
                          <td style={s.td}><span style={{ fontSize: "13px", color: "#6b7280" }}>{new Date(v.created_at).toLocaleString("pt-BR")}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal novo cliente */}
      {modalCliente && (
        <div style={s.overlay} onClick={() => setModalCliente(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", color: "#071633" }}>Novo Cliente</h2>
            <div style={s.fg}>
              <label style={s.label}>Nome *</label>
              <input style={s.input} value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Nome completo" autoFocus />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={s.fg}>
                <label style={s.label}>Telefone</label>
                <input style={s.input} value={formTel} onChange={e => setFormTel(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div style={s.fg}>
                <label style={s.label}>Cidade</label>
                <input style={s.input} value={formCidade} onChange={e => setFormCidade(e.target.value)} placeholder="Sao Paulo" />
              </div>
            </div>
            <div style={s.fg}>
              <label style={s.label}>E-mail</label>
              <input style={s.input} type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button style={s.btnSecondary} onClick={() => setModalCliente(false)}>Cancelar</button>
              <button style={s.btnPrimary} onClick={criarCliente} disabled={salvando}>
                {salvando ? "Salvando..." : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}