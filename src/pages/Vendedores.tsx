import { useEffect, useState } from "react";

const API_URL = "https://sistema-estoque-tenis-backend.onrender.com/api";

type Vendedor = {
  id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  complemento: string | null;
  percentual_comissao: number;
  meta_mensal: number;
  status: string;
  token: string | null;
  login_ativo: boolean;
  senha_configurada: boolean;
  link_portal: string | null;
  created_at: string | null;
};

const EMPTY_FORM = {
  nome: "",
  telefone: "",
  email: "",
  cep: "",
  endereco: "",
  bairro: "",
  cidade: "",
  complemento: "",
  percentual_comissao: "",
  meta_mensal: "",
  status: "Ativo",
};

const s = {
  page:         { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:        { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle:     { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  card:         { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  toolbar:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  input:        { padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", width: "260px" } as React.CSSProperties,
  inputFull:    { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  select:       { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" as const } as React.CSSProperties,
  label:        { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  fg:           { marginBottom: "14px" } as React.CSSProperties,
  formRow2:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } as React.CSSProperties,
  sectionTitle: { margin: "20px 0 12px", color: "#071633", fontSize: "1rem", fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" } as React.CSSProperties,
  btnPrimary:   { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger:    { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  btnEdit:      { backgroundColor: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  btnSuccess:   { backgroundColor: "#dcfce7", color: "#16a34a", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  table:        { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:           { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const } as React.CSSProperties,
  td:           { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
  overlay:      { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modal:        { backgroundColor: "#fff", borderRadius: "14px", padding: "32px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } as React.CSSProperties,
};

export default function Vendedores() {
  const [vendedores, setVendedores]     = useState<Vendedor[]>([]);
  const [busca, setBusca]               = useState("");
  const [loading, setLoading]           = useState(true);
  const [modalAberto, setModalAberto]   = useState(false);
  const [editando, setEditando]         = useState<Vendedor | null>(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [salvando, setSalvando]         = useState(false);

  // Modal de senha
  const [modalSenha, setModalSenha]     = useState(false);
  const [vendedorSenha, setVendedorSenha] = useState<Vendedor | null>(null);
  const [novaSenha, setNovaSenha]       = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/vendedores/`);
      const data = await res.json();
      setVendedores(data.success ? data.data : []);
    } catch {
      alert("Erro ao carregar vendedores.");
    } finally {
      setLoading(false);
    }
  }

  function abrirCadastro() {
    setEditando(null);
    setForm(EMPTY_FORM);
    setModalAberto(true);
  }

  function abrirEdicao(v: Vendedor) {
    setEditando(v);
    setForm({
      nome:                v.nome || "",
      telefone:            v.telefone || "",
      email:               v.email || "",
      cep:                 v.cep || "",
      endereco:            v.endereco || "",
      bairro:              v.bairro || "",
      cidade:              v.cidade || "",
      complemento:         v.complemento || "",
      percentual_comissao: String(v.percentual_comissao || ""),
      meta_mensal:         String(v.meta_mensal || ""),
      status:              v.status || "Ativo",
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setForm(EMPTY_FORM);
  }

  async function salvar() {
    if (!form.nome.trim()) { alert("Nome e obrigatorio."); return; }
    setSalvando(true);
    try {
      const url    = editando ? `${API_URL}/vendedores/${editando.id}` : `${API_URL}/vendedores/`;
      const method = editando ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome:                form.nome.trim(),
          telefone:            form.telefone || null,
          email:               form.email || null,
          cep:                 form.cep || null,
          endereco:            form.endereco || null,
          bairro:              form.bairro || null,
          cidade:              form.cidade || null,
          complemento:         form.complemento || null,
          percentual_comissao: Number(form.percentual_comissao) || 0,
          meta_mensal:         Number(form.meta_mensal) || 0,
          status:              form.status,
        }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.message || "Erro ao salvar."); return; }
      fecharModal();
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(v: Vendedor) {
    if (!confirm(`Excluir o vendedor "${v.nome}"?`)) return;
    try {
      await fetch(`${API_URL}/vendedores/${v.id}`, { method: "DELETE" });
      carregar();
    } catch {
      alert("Erro ao excluir vendedor.");
    }
  }

  async function regenerarToken(v: Vendedor) {
    if (!confirm(`Regenerar link do portal de "${v.nome}"?`)) return;
    try {
      const res  = await fetch(`${API_URL}/vendedores/${v.id}/regenerar-token`, { method: "POST" });
      const data = await res.json();
      if (!data.success) { alert(data.message || "Erro."); return; }
      carregar();
    } catch {
      alert("Erro ao regenerar token.");
    }
  }

  function abrirModalSenha(v: Vendedor) {
    setVendedorSenha(v);
    setNovaSenha("");
    setModalSenha(true);
  }

  async function definirSenha() {
    if (!vendedorSenha) return;
    if (novaSenha.length < 4) { alert("Senha deve ter pelo menos 4 caracteres."); return; }
    setSalvandoSenha(true);
    try {
      const res  = await fetch(`${API_URL}/vendedores/${vendedorSenha.id}/senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: novaSenha }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.message || "Erro."); return; }
      setModalSenha(false);
      carregar();
    } finally {
      setSalvandoSenha(false);
    }
  }

  const vendedoresFiltrados = vendedores.filter(v =>
    v.nome.toLowerCase().includes(busca.toLowerCase()) ||
    v.telefone?.toLowerCase().includes(busca.toLowerCase()) ||
    v.cidade?.toLowerCase().includes(busca.toLowerCase())
  );

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div style={s.page}>
      <h1 style={s.title}>Vendedores</h1>
      <p style={s.subtitle}>Cadastro e gerenciamento de vendedores.</p>

      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Vendedores ({vendedores.length})</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              style={s.input}
              placeholder="Buscar por nome, telefone, cidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <button style={s.btnPrimary} onClick={abrirCadastro}>+ Novo Vendedor</button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>Carregando...</p>
        ) : vendedoresFiltrados.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>
            {busca ? "Nenhum vendedor encontrado." : "Nenhum vendedor cadastrado ainda."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Nome", "Telefone", "Cidade", "Comissao", "Status", "Portal", "Acoes"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendedoresFiltrados.map(v => (
                  <tr key={v.id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={s.td}><strong>{v.nome}</strong></td>
                    <td style={s.td}>{v.telefone || "-"}</td>
                    <td style={s.td}>{v.cidade || "-"}</td>
                    <td style={s.td}>{Number(v.percentual_comissao).toFixed(1)}%</td>
                    <td style={s.td}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600,
                        backgroundColor: v.status === "Ativo" ? "#dcfce7" : "#fee2e2",
                        color: v.status === "Ativo" ? "#16a34a" : "#dc2626",
                      }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={s.td}>
                      {v.link_portal ? (
                        <a href={v.link_portal} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: "12px", color: "#2563eb", textDecoration: "underline" }}>
                          Abrir portal
                        </a>
                      ) : "-"}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button style={s.btnEdit} onClick={() => abrirEdicao(v)}>Editar</button>
                        <button style={s.btnSuccess} onClick={() => abrirModalSenha(v)}>
                          {v.senha_configurada ? "Alterar Senha" : "Definir Senha"}
                        </button>
                        <button style={s.btnEdit} onClick={() => regenerarToken(v)}>Novo Link</button>
                        <button style={s.btnDanger} onClick={() => excluir(v)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal cadastro/edicao */}
      {modalAberto && (
        <div style={s.overlay} onClick={fecharModal}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 4px", color: "#071633" }}>
              {editando ? "Editar Vendedor" : "Novo Vendedor"}
            </h2>

            <div style={s.sectionTitle}>Dados Pessoais</div>

            <div style={s.fg}>
              <label style={s.label}>Nome *</label>
              <input style={s.inputFull} value={form.nome} onChange={f("nome")} placeholder="Nome completo" autoFocus />
            </div>

            <div style={{ ...s.fg, ...s.formRow2 }}>
              <div>
                <label style={s.label}>Telefone</label>
                <input style={s.inputFull} value={form.telefone} onChange={f("telefone")} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label style={s.label}>E-mail</label>
                <input style={s.inputFull} type="email" value={form.email} onChange={f("email")} placeholder="email@exemplo.com" />
              </div>
            </div>

            <div style={s.sectionTitle}>Endereco</div>

            <div style={{ ...s.fg, ...s.formRow2 }}>
              <div>
                <label style={s.label}>CEP</label>
                <input style={s.inputFull} value={form.cep} onChange={f("cep")} placeholder="00000-000" maxLength={9} />
              </div>
              <div>
                <label style={s.label}>Bairro</label>
                <input style={s.inputFull} value={form.bairro} onChange={f("bairro")} placeholder="Bairro" />
              </div>
            </div>

            <div style={{ ...s.fg, ...s.formRow2 }}>
              <div>
                <label style={s.label}>Endereco</label>
                <input style={s.inputFull} value={form.endereco} onChange={f("endereco")} placeholder="Rua, numero" />
              </div>
              <div>
                <label style={s.label}>Complemento</label>
                <input style={s.inputFull} value={form.complemento} onChange={f("complemento")} placeholder="Apto, bloco..." />
              </div>
            </div>

            <div style={s.fg}>
              <label style={s.label}>Cidade</label>
              <input style={s.inputFull} value={form.cidade} onChange={f("cidade")} placeholder="Cidade" />
            </div>

            <div style={s.sectionTitle}>Comercial</div>

            <div style={{ ...s.fg, ...s.formRow2 }}>
              <div>
                <label style={s.label}>Comissao (%)</label>
                <input style={s.inputFull} type="number" step="0.1" min="0" max="100" value={form.percentual_comissao} onChange={f("percentual_comissao")} placeholder="0" />
              </div>
              <div>
                <label style={s.label}>Meta Mensal (R$)</label>
                <input style={s.inputFull} type="number" step="0.01" min="0" value={form.meta_mensal} onChange={f("meta_mensal")} placeholder="0,00" />
              </div>
            </div>

            <div style={s.fg}>
              <label style={s.label}>Status</label>
              <select style={s.select} value={form.status} onChange={f("status")}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button onClick={fecharModal} style={{ ...s.btnPrimary, backgroundColor: "#f3f4f6", color: "#374151" }}>
                Cancelar
              </button>
              <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : editando ? "Salvar Alteracoes" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal definir senha */}
      {modalSenha && vendedorSenha && (
        <div style={s.overlay} onClick={() => setModalSenha(false)}>
          <div style={{ ...s.modal, maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 16px", color: "#071633" }}>
              {vendedorSenha.senha_configurada ? "Alterar Senha" : "Definir Senha"} — {vendedorSenha.nome}
            </h2>
            <div style={s.fg}>
              <label style={s.label}>Nova Senha (min. 4 caracteres)</label>
              <input
                style={s.inputFull}
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Digite a senha"
                autoFocus
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button onClick={() => setModalSenha(false)} style={{ ...s.btnPrimary, backgroundColor: "#f3f4f6", color: "#374151" }}>
                Cancelar
              </button>
              <button style={s.btnPrimary} onClick={definirSenha} disabled={salvandoSenha}>
                {salvandoSenha ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}