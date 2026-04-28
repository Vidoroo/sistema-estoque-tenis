import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:5000/api";

type Produto = {
  id: number;
  name: string;
  preco_varejo: number;
  tamanhos: Record<string, string>;
  image: string;
};

type Cliente = {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
};

const s = {
  page:        { fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", backgroundColor: "#f8fafc" } as React.CSSProperties,
  header:      { backgroundColor: "#071633", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" } as React.CSSProperties,
  body:        { padding: "24px", maxWidth: "1100px", margin: "0 auto" } as React.CSSProperties,
  card:        { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  tabs:        { display: "flex", gap: "8px", marginBottom: "24px" } as React.CSSProperties,
  tab:         (ativo: boolean) => ({ padding: "10px 20px", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", border: "none", backgroundColor: ativo ? "#071633" : "#f3f4f6", color: ativo ? "#fff" : "#374151" } as React.CSSProperties),
  input:       { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  label:       { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  fg:          { marginBottom: "14px" } as React.CSSProperties,
  btnPrimary:  { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnSecondary:{ backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  table:       { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:          { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const } as React.CSSProperties,
  td:          { padding: "12px", borderBottom: "1px solid #f3f4f6" } as React.CSSProperties,
  overlay:     { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modal:       { backgroundColor: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } as React.CSSProperties,
};

export default function VendedorPortal() {
  const { token }    = useParams<{ token: string }>();
  const navigate     = useNavigate();
  const vendedorNome = localStorage.getItem("vendedor_nome") || "Vendedor";

  const [aba, setAba]           = useState<"produtos" | "clientes">("produtos");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Modal novo cliente
  const [modalCliente, setModalCliente] = useState(false);
  const [formNome, setFormNome]         = useState("");
  const [formTel, setFormTel]           = useState("");
  const [formEmail, setFormEmail]       = useState("");
  const [formCidade, setFormCidade]     = useState("");
  const [salvando, setSalvando]         = useState(false);

  const headers = {
    "Content-Type": "application/json",
    "X-Vendedor-Token": token || "",
  };

  // Valida sessão
  useEffect(() => {
    const t = localStorage.getItem("vendedor_token");
    if (!t || t !== token) { navigate(`/vendedor/${token}`); return; }
    carregar();
  }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const [rP, rC] = await Promise.all([
        fetch(`${API_URL}/vendedor-auth/produtos`, { headers }),
        fetch(`${API_URL}/vendedor-auth/clientes`, { headers }),
      ]);
      const [jP, jC] = await Promise.all([rP.json(), rC.json()]);
      setProdutos(jP.data || []);
      setClientes(jC.data || []);
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

  const criarCliente = async () => {
    if (!formNome.trim()) { alert("Nome é obrigatório."); return; }
    setSalvando(true);
    try {
      const res = await fetch(`${API_URL}/vendedor-auth/clientes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          nome: formNome,
          telefone: formTel || null,
          email: formEmail || null,
          cidade: formCidade || null,
        }),
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

  const produtosFiltrados = produtos.filter(p =>
    p.name.toLowerCase().includes(busca.toLowerCase())
  );

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <span style={{ fontSize: "20px", fontWeight: 800 }}>👟 Portal do Vendedor</span>
          <span style={{ marginLeft: "12px", fontSize: "14px", opacity: 0.8 }}>
            Olá, {vendedorNome}!
          </span>
        </div>
        <button onClick={logout} style={{ ...s.btnSecondary, fontSize: "13px", padding: "7px 14px" }}>
          Sair
        </button>
      </header>

      <div style={s.body}>
        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(aba === "produtos")} onClick={() => { setAba("produtos"); setBusca(""); }}>
            📦 Produtos ({produtos.length})
          </button>
          <button style={s.tab(aba === "clientes")} onClick={() => { setAba("clientes"); setBusca(""); }}>
            👤 Meus Clientes ({clientes.length})
          </button>
        </div>

        {/* Barra de busca */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            style={{ ...s.input, maxWidth: "320px" }}
            placeholder={aba === "produtos" ? "Buscar produto..." : "Buscar cliente..."}
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {aba === "clientes" && (
            <button style={s.btnPrimary} onClick={() => setModalCliente(true)}>
              + Novo Cliente
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "40px" }}>Carregando...</p>
        ) : aba === "produtos" ? (

          /* Grid de produtos */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {produtosFiltrados.length === 0 ? (
              <p style={{ color: "#6b7280", gridColumn: "1/-1", textAlign: "center", padding: "32px" }}>
                Nenhum produto encontrado.
              </p>
            ) : produtosFiltrados.map(p => {
              const tamanhosDispo = Object.entries(p.tamanhos || {}).filter(([, q]) => Number(q) > 0);
              return (
                <div key={p.id} style={s.card}>
                  {p.image && (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px" }}
                    />
                  )}
                  <h3 style={{ margin: "0 0 6px", fontSize: "15px", color: "#071633" }}>{p.name}</h3>

                  {/* Somente preço de venda — sem custo */}
                  <p style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#16a34a" }}>
                    R$ {Number(p.preco_varejo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>

                  {tamanhosDispo.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {tamanhosDispo.map(([t, q]) => (
                        <span key={t} style={{
                          padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                          backgroundColor: "#f0f9ff", color: "#2563eb", border: "1px solid #bfdbfe",
                        }}>
                          {t} <span style={{ opacity: 0.6 }}>({q})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: "12px", color: "#dc2626", fontWeight: 600 }}>
                      Sem estoque disponível
                    </p>
                  )}
                </div>
              );
            })}
          </div>

        ) : (

          /* Tabela de clientes */
          <div style={s.card}>
            {clientesFiltrados.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>
                {busca ? "Nenhum cliente encontrado." : "Você ainda não cadastrou nenhum cliente."}
              </p>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Nome", "Telefone", "E-mail", "Cidade"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map(c => (
                    <tr
                      key={c.id}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                      style={{ transition: "background 0.15s" }}
                    >
                      <td style={s.td}><strong>{c.nome}</strong></td>
                      <td style={s.td}>{c.telefone ?? "—"}</td>
                      <td style={s.td}>{c.email ?? "—"}</td>
                      <td style={s.td}>{c.cidade ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
                <input style={s.input} value={formCidade} onChange={e => setFormCidade(e.target.value)} placeholder="São Paulo" />
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