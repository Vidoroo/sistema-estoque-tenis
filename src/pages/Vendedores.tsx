import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

type Vendedor = {
  id: number; nome: string; telefone?: string; email?: string;
  percentual_comissao?: number; meta_mensal?: number; status?: string;
  token?: string; login_ativo?: boolean; senha_configurada?: boolean; link_portal?: string;
};

const EMPTY_FORM = { nome: "", telefone: "", email: "", percentual_comissao: "", meta_mensal: "", status: "Ativo" };

const s = {
  page:     { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:    { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle: { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid:     { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card:     { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  toolbar:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  input:    { padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", width: "260px" } as React.CSSProperties,
  btnPrimary: { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger:  { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "12px", fontWeight: 600 } as React.CSSProperties,
  btnEdit:    { backgroundColor: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "12px", fontWeight: 600 } as React.CSSProperties,
  btnGreen:   { backgroundColor: "#dcfce7", color: "#16a34a", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "12px", fontWeight: 600 } as React.CSSProperties,
  table:  { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:     { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  td:     { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
  overlay: { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modal:   { backgroundColor: "#fff", borderRadius: "14px", padding: "32px", width: "100%", maxWidth: "520px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } as React.CSSProperties,
  label:   { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  formInput: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" as const, outline: "none" } as React.CSSProperties,
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } as React.CSSProperties,
  fg:      { marginBottom: "16px" } as React.CSSProperties,
};

function StatusBadge({ status }: { status?: string }) {
  const ativo = status === "Ativo";
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: ativo ? "#dcfce7" : "#f3f4f6", color: ativo ? "#16a34a" : "#6b7280" }}>{status ?? "—"}</span>;
}

export default function Vendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [busca, setBusca]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [erro, setErro]             = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando]       = useState(false);
  const [editando, setEditando]       = useState<Vendedor | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  // Modal senha
  const [modalSenha, setModalSenha]     = useState<Vendedor | null>(null);
  const [novaSenha, setNovaSenha]       = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Modal link
  const [modalLink, setModalLink] = useState<Vendedor | null>(null);

  const carregar = async () => {
    setLoading(true); setErro(null);
    try {
      const res  = await fetch(`${API_URL}/vendedores/`);
      const json = await res.json();
      setVendedores(json.data || []);
    } catch { setErro("Erro ao carregar vendedores."); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = vendedores.filter(v => {
    const t = busca.toLowerCase();
    return v.nome?.toLowerCase().includes(t) || v.email?.toLowerCase().includes(t);
  });

  const abrirCadastro = () => { setEditando(null); setForm(EMPTY_FORM); setModalAberto(true); };
  const abrirEdicao   = (v: Vendedor) => {
    setEditando(v);
    setForm({ nome: v.nome ?? "", telefone: v.telefone ?? "", email: v.email ?? "",
      percentual_comissao: String(v.percentual_comissao ?? ""),
      meta_mensal: String(v.meta_mensal ?? ""), status: v.status ?? "Ativo" });
    setModalAberto(true);
  };
  const fecharModal = () => { setModalAberto(false); setEditando(null); setForm(EMPTY_FORM); };

  const salvar = async () => {
    if (!form.nome.trim()) { alert("Nome é obrigatório."); return; }
    setSalvando(true);
    try {
      const url    = editando ? `${API_URL}/vendedores/${editando.id}` : `${API_URL}/vendedores/`;
      const method = editando ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: form.nome, telefone: form.telefone || null, email: form.email || null,
          percentual_comissao: Number(form.percentual_comissao || 0),
          meta_mensal: Number(form.meta_mensal || 0), status: form.status }) });
      const json = await res.json();
      if (!res.ok) { alert(json.message || "Erro."); return; }
      fecharModal(); carregar();
    } catch { alert("Erro ao salvar."); }
    finally { setSalvando(false); }
  };

  const excluir = async (v: Vendedor) => {
    if (!confirm(`Excluir "${v.nome}"?`)) return;
    await fetch(`${API_URL}/vendedores/${v.id}`, { method: "DELETE" });
    carregar();
  };

  const salvarSenha = async () => {
    if (!modalSenha || novaSenha.length < 4) { alert("Senha deve ter pelo menos 4 caracteres."); return; }
    setSalvandoSenha(true);
    try {
      const res = await fetch(`${API_URL}/vendedores/${modalSenha.id}/senha`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: novaSenha }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || "Erro."); return; }
      setModalSenha(null); setNovaSenha(""); carregar();
    } finally { setSalvandoSenha(false); }
  };

  const regenerarToken = async (v: Vendedor) => {
    if (!confirm("Isso vai invalidar o link atual. Continuar?")) return;
    const res  = await fetch(`${API_URL}/vendedores/${v.id}/regenerar-token`, { method: "POST" });
    const json = await res.json();
    if (res.ok) { carregar(); setModalLink(json.data ? { ...v, token: json.data.token, link_portal: json.data.link_portal } : v); }
  };

  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert("Link copiado!");
  };

  const comissaoMedia = vendedores.length > 0
    ? (vendedores.reduce((a, v) => a + Number(v.percentual_comissao || 0), 0) / vendedores.length).toFixed(1)
    : "0.0";

  return (
    <div style={s.page}>
      <h1 style={s.title}>Vendedores</h1>
      <p style={s.subtitle}>Cadastro, portal de acesso e gerenciamento de vendedores.</p>

      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}><p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total</p><h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{vendedores.length}</h2></div>
        <div style={s.summaryCard("#16a34a")}><p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Ativos</p><h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{vendedores.filter(v => v.status === "Ativo").length}</h2></div>
        <div style={s.summaryCard("#2563eb")}><p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Comissão Média</p><h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{comissaoMedia}%</h2></div>
        <div style={s.summaryCard("#7c3aed")}><p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Com Portal Ativo</p><h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{vendedores.filter(v => v.senha_configurada && v.login_ativo).length}</h2></div>
      </div>

      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Vendedores</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <input style={s.input} placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
            <button style={s.btnPrimary} onClick={abrirCadastro}>+ Novo Vendedor</button>
          </div>
        </div>

        {erro && <p style={{ color: "#dc2626", marginBottom: "12px" }}>{erro}</p>}

        {loading ? <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>Carregando...</p>
        : filtrados.length === 0 ? <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>Nenhum vendedor encontrado.</p>
        : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>{["Nome","Telefone","Comissão","Meta","Status","Portal","Ações"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtrados.map(v => (
                  <tr key={v.id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={s.td}><strong>{v.nome}</strong></td>
                    <td style={s.td}>{v.telefone ?? "—"}</td>
                    <td style={s.td}>{Number(v.percentual_comissao ?? 0).toFixed(1)}%</td>
                    <td style={s.td}>R$ {Number(v.meta_mensal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td style={s.td}><StatusBadge status={v.status} /></td>
                    <td style={s.td}>
                      {v.senha_configurada
                        ? <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>✓ Ativo</span>
                        : <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}>⚠ Sem senha</span>}
                    </td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" as const }}>
                        <button style={s.btnEdit} onClick={() => abrirEdicao(v)}>Editar</button>
                        <button style={s.btnGreen} onClick={() => { setModalSenha(v); setNovaSenha(""); }}>🔑 Senha</button>
                        <button style={{ ...s.btnEdit, backgroundColor: "#f0f9ff" }} onClick={() => setModalLink(v)}>🔗 Link</button>
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

      {/* Modal cadastro/edição */}
      {modalAberto && (
        <div style={s.overlay} onClick={fecharModal}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", color: "#071633" }}>{editando ? "Editar Vendedor" : "Novo Vendedor"}</h2>
            <div style={s.fg}><label style={s.label}>Nome *</label><input style={s.formInput} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div style={{ ...s.fg, ...s.formRow }}>
              <div><label style={s.label}>Telefone</label><input style={s.formInput} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
              <div><label style={s.label}>E-mail</label><input style={s.formInput} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div style={{ ...s.fg, ...s.formRow }}>
              <div><label style={s.label}>% Comissão</label><input style={s.formInput} type="number" step="0.1" min="0" max="100" value={form.percentual_comissao} onChange={e => setForm({ ...form, percentual_comissao: e.target.value })} /></div>
              <div><label style={s.label}>Meta Mensal (R$)</label><input style={s.formInput} type="number" step="0.01" min="0" value={form.meta_mensal} onChange={e => setForm({ ...form, meta_mensal: e.target.value })} /></div>
            </div>
            <div style={s.fg}><label style={s.label}>Status</label>
              <select style={s.formInput} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Ativo">Ativo</option><option value="Inativo">Inativo</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={fecharModal} style={{ ...s.btnPrimary, backgroundColor: "#f3f4f6", color: "#374151" }}>Cancelar</button>
              <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : editando ? "Salvar" : "Cadastrar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal definir senha */}
      {modalSenha && (
        <div style={s.overlay} onClick={() => setModalSenha(null)}>
          <div style={{ ...s.modal, maxWidth: "380px" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 8px", color: "#071633" }}>Definir Senha</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>Vendedor: <strong>{modalSenha.nome}</strong></p>
            <div style={s.fg}>
              <label style={s.label}>Nova Senha (mín. 4 caracteres)</label>
              <input style={s.formInput} type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Digite a senha" autoFocus />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setModalSenha(null)} style={{ ...s.btnPrimary, backgroundColor: "#f3f4f6", color: "#374151" }}>Cancelar</button>
              <button style={s.btnPrimary} onClick={salvarSenha} disabled={salvandoSenha}>{salvandoSenha ? "Salvando..." : "Definir Senha"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal link do portal */}
      {modalLink && (
        <div style={s.overlay} onClick={() => setModalLink(null)}>
          <div style={{ ...s.modal, maxWidth: "480px" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 8px", color: "#071633" }}>🔗 Link do Portal</h2>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>Vendedor: <strong>{modalLink.nome}</strong></p>

            {modalLink.link_portal ? (
              <>
                <div style={{ backgroundColor: "#f0f9ff", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <code style={{ fontSize: "12px", color: "#2563eb", wordBreak: "break-all" as const }}>{modalLink.link_portal}</code>
                  <button style={{ ...s.btnEdit, whiteSpace: "nowrap" as const }} onClick={() => copiarLink(modalLink.link_portal!)}>Copiar</button>
                </div>
                <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "16px" }}>
                  {modalLink.senha_configurada
                    ? "✓ Senha configurada — o vendedor já pode acessar."
                    : "⚠ Senha ainda não foi definida. Configure a senha antes de compartilhar o link."}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button style={{ ...s.btnDanger, fontSize: "13px" }} onClick={() => regenerarToken(modalLink)}>🔄 Gerar novo link</button>
                  <button style={{ ...s.btnPrimary, backgroundColor: "#f3f4f6", color: "#374151" }} onClick={() => setModalLink(null)}>Fechar</button>
                </div>
              </>
            ) : (
              <p style={{ color: "#f59e0b" }}>Este vendedor não tem token. Salve o vendedor novamente.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}