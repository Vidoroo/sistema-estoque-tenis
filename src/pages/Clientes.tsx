import { useEffect, useState } from "react";

const API_URL = "https://sistema-estoque-tenis-backend.onrender.com/api";

type Cliente = {
  id: number;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  complemento: string | null;
  observacoes: string | null;
};

const EMPTY_FORM = {
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  email: "",
  cep: "",
  endereco: "",
  bairro: "",
  cidade: "",
  complemento: "",
  observacoes: "",
};

const s = {
  page:        { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:       { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle:    { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  card:        { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  toolbar:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  input:       { padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", width: "260px" } as React.CSSProperties,
  inputFull:   { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  label:       { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  fg:          { marginBottom: "14px" } as React.CSSProperties,
  formRow2:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } as React.CSSProperties,
  formRow3:    { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" } as React.CSSProperties,
  btnPrimary:  { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger:   { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  btnEdit:     { backgroundColor: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  table:       { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:          { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const } as React.CSSProperties,
  td:          { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
  overlay:     { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modal:       { backgroundColor: "#fff", borderRadius: "14px", padding: "32px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } as React.CSSProperties,
  sectionTitle:{ margin: "20px 0 12px", color: "#071633", fontSize: "1rem", fontWeight: 700, borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" } as React.CSSProperties,
};

export default function Clientes() {
  const [clientes, setClientes]   = useState<Cliente[]>([]);
  const [busca, setBusca]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando]   = useState<Cliente | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [salvando, setSalvando]   = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/clientes`);
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch {
      alert("Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  function abrirCadastro() {
    setEditando(null);
    setForm(EMPTY_FORM);
    setModalAberto(true);
  }

  function abrirEdicao(c: Cliente) {
    setEditando(c);
    setForm({
      nome:        c.nome || "",
      cpf_cnpj:   c.cpf_cnpj || "",
      telefone:    c.telefone || "",
      email:       c.email || "",
      cep:         c.cep || "",
      endereco:    c.endereco || "",
      bairro:      c.bairro || "",
      cidade:      c.cidade || "",
      complemento: c.complemento || "",
      observacoes: c.observacoes || "",
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
      const url    = editando ? `${API_URL}/clientes/${editando.id}` : `${API_URL}/clientes`;
      const method = editando ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome:        form.nome.trim(),
          cpf_cnpj:   form.cpf_cnpj || null,
          telefone:    form.telefone || null,
          email:       form.email || null,
          cep:         form.cep || null,
          endereco:    form.endereco || null,
          bairro:      form.bairro || null,
          cidade:      form.cidade || null,
          complemento: form.complemento || null,
          observacoes: form.observacoes || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.erro || "Erro ao salvar."); return; }
      fecharModal();
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(c: Cliente) {
    if (!confirm(`Excluir o cliente "${c.nome}"?`)) return;
    try {
      await fetch(`${API_URL}/clientes/${c.id}`, { method: "DELETE" });
      carregar();
    } catch {
      alert("Erro ao excluir cliente.");
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.toLowerCase().includes(busca.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(busca.toLowerCase())
  );

  const f = (v: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [v]: e.target.value }));

  return (
    <div style={s.page}>
      <h1 style={s.title}>Clientes</h1>
      <p style={s.subtitle}>Cadastro e gerenciamento de clientes.</p>

      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Clientes ({clientes.length})</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              style={s.input}
              placeholder="Buscar por nome, telefone, cidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <button style={s.btnPrimary} onClick={abrirCadastro}>+ Novo Cliente</button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>Carregando...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>
            {busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Nome", "CPF/CNPJ", "Telefone", "E-mail", "Cidade", "Bairro", "Acoes"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
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
                    <td style={s.td}>{c.cpf_cnpj || "-"}</td>
                    <td style={s.td}>{c.telefone || "-"}</td>
                    <td style={s.td}>{c.email || "-"}</td>
                    <td style={s.td}>{c.cidade || "-"}</td>
                    <td style={s.td}>{c.bairro || "-"}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={s.btnEdit} onClick={() => abrirEdicao(c)}>Editar</button>
                        <button style={s.btnDanger} onClick={() => excluir(c)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <div style={s.overlay} onClick={fecharModal}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 4px", color: "#071633" }}>
              {editando ? "Editar Cliente" : "Novo Cliente"}
            </h2>

            <div style={s.sectionTitle}>Dados Pessoais</div>

            <div style={{ ...s.fg, ...s.formRow2 }}>
              <div>
                <label style={s.label}>Nome *</label>
                <input style={s.inputFull} value={form.nome} onChange={f("nome")} placeholder="Nome completo" autoFocus />
              </div>
              <div>
                <label style={s.label}>CPF / CNPJ</label>
                <input style={s.inputFull} value={form.cpf_cnpj} onChange={f("cpf_cnpj")} placeholder="000.000.000-00" />
              </div>
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

            <div style={s.sectionTitle}>Observacoes</div>

            <div style={s.fg}>
              <textarea
                style={{ ...s.inputFull, minHeight: "72px", resize: "vertical" }}
                value={form.observacoes}
                onChange={f("observacoes")}
                placeholder="Informacoes adicionais..."
              />
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
    </div>
  );
}