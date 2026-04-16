import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api";

type Vendedor = {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  percentual_comissao?: number;
  meta_mensal?: number;
  status?: string;
};

const EMPTY_FORM = {
  nome: "",
  telefone: "",
  email: "",
  percentual_comissao: "",
  meta_mensal: "",
  status: "Ativo",
};

const s = {
  page: {
    fontFamily: "'Segoe UI', sans-serif",
    color: "#071633",
  } as React.CSSProperties,

  title: {
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "#071633",
    marginBottom: "4px",
  } as React.CSSProperties,

  subtitle: {
    color: "#6b7280",
    marginBottom: "24px",
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  } as React.CSSProperties,

  summaryCard: (color: string) => ({
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    borderLeft: `4px solid ${color}`,
  } as React.CSSProperties),

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  } as React.CSSProperties,

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap" as const,
    gap: "12px",
  } as React.CSSProperties,

  input: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    width: "260px",
  } as React.CSSProperties,

  btnPrimary: {
    backgroundColor: "#071633",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  } as React.CSSProperties,

  btnDanger: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "6px",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  } as React.CSSProperties,

  btnEdit: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    border: "none",
    borderRadius: "6px",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
  } as React.CSSProperties,

  th: {
    textAlign: "left" as const,
    padding: "10px 12px",
    borderBottom: "2px solid #e5e7eb",
    color: "#6b7280",
    fontWeight: 600,
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  } as React.CSSProperties,

  td: {
    padding: "12px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "middle" as const,
  } as React.CSSProperties,

  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  } as React.CSSProperties,

  modal: {
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "32px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  } as React.CSSProperties,

  formGroup: {
    marginBottom: "16px",
  } as React.CSSProperties,

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "4px",
  } as React.CSSProperties,

  formInput: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    outline: "none",
  } as React.CSSProperties,

  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  } as React.CSSProperties,
};

export default function Vendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState<Vendedor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const carregarVendedores = async () => {
    const res = await fetch(`${API_URL}/vendedores/`);
    const json = await res.json();
    setVendedores(json.data || []);
  };

  useEffect(() => {
    carregarVendedores();
  }, []);

  const vendedoresFiltrados = vendedores.filter((v) => {
    const termo = busca.toLowerCase();
    return (
      v.nome?.toLowerCase().includes(termo) ||
      v.email?.toLowerCase().includes(termo) ||
      v.status?.toLowerCase().includes(termo)
    );
  });

  const abrirCadastro = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setModalAberto(true);
  };

  const abrirEdicao = (v: Vendedor) => {
    setEditando(v);
    setForm({
      nome: v.nome ?? "",
      telefone: v.telefone ?? "",
      email: v.email ?? "",
      percentual_comissao: String(v.percentual_comissao ?? ""),
      meta_mensal: String(v.meta_mensal ?? ""),
      status: v.status ?? "Ativo",
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setForm(EMPTY_FORM);
  };

  const salvar = async () => {
    if (!form.nome.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    setSalvando(true);

    const payload = {
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      percentual_comissao: Number(form.percentual_comissao || 0),
      meta_mensal: Number(form.meta_mensal || 0),
      status: form.status,
    };

    const url = editando
      ? `${API_URL}/vendedores/${editando.id}`
      : `${API_URL}/vendedores/`;

    const method = editando ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    setSalvando(false);

    if (!res.ok) {
      alert(json.message || "Erro ao salvar vendedor.");
      return;
    }

    fecharModal();
    carregarVendedores();
  };

  const excluir = async (v: Vendedor) => {
    if (!confirm(`Excluir o vendedor "${v.nome}"?`)) return;

    const res = await fetch(`${API_URL}/vendedores/${v.id}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.message || "Erro ao excluir vendedor.");
      return;
    }

    carregarVendedores();
  };

  return (
    <div style={s.page}>
      <h1 style={s.title}>Vendedores</h1>
      <p style={s.subtitle}>Cadastro, consulta e gerenciamento de vendedores.</p>

      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Total de Vendedores
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {vendedores.length}
          </h2>
        </div>

        <div style={s.summaryCard("#2563eb")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Comissão Média
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {vendedores.length > 0
              ? (
                  vendedores.reduce((acc, v) => acc + Number(v.percentual_comissao || 0), 0) /
                  vendedores.length
                ).toFixed(2)
              : "0.00"}
            %
          </h2>
        </div>

        <div style={s.summaryCard("#16a34a")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Ativos
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {vendedores.filter((v) => v.status === "Ativo").length}
          </h2>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Vendedores</h2>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              style={s.input}
              placeholder="Buscar por nome, e-mail, status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button style={s.btnPrimary} onClick={abrirCadastro}>
              + Novo Vendedor
            </button>
          </div>
        </div>

        {vendedoresFiltrados.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>
            Nenhum vendedor cadastrado ainda.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Nome", "Telefone", "E-mail", "Comissão", "Meta", "Ações"].map((h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendedoresFiltrados.map((v) => (
                  <tr key={v.id}>
                    <td style={s.td}><strong>{v.nome}</strong></td>
                    <td style={s.td}>{v.telefone ?? "—"}</td>
                    <td style={s.td}>{v.email ?? "—"}</td>
                    <td style={s.td}>{Number(v.percentual_comissao ?? 0).toFixed(2)}%</td>
                    <td style={s.td}>R$ {Number(v.meta_mensal ?? 0).toFixed(2)}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={s.btnEdit} onClick={() => abrirEdicao(v)}>
                          Editar
                        </button>
                        <button style={s.btnDanger} onClick={() => excluir(v)}>
                          Excluir
                        </button>
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
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", color: "#071633" }}>
              {editando ? "Editar Vendedor" : "Novo Vendedor"}
            </h2>

            <div style={s.formGroup}>
              <label style={s.label}>Nome *</label>
              <input
                style={s.formInput}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <div>
                <label style={s.label}>Telefone</label>
                <input
                  style={s.formInput}
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
              <div>
                <label style={s.label}>E-mail</label>
                <input
                  style={s.formInput}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <div>
                <label style={s.label}>% Comissão</label>
                <input
                  style={s.formInput}
                  type="number"
                  step="0.01"
                  value={form.percentual_comissao}
                  onChange={(e) => setForm({ ...form, percentual_comissao: e.target.value })}
                />
              </div>
              <div>
                <label style={s.label}>Meta Mensal</label>
                <input
                  style={s.formInput}
                  type="number"
                  step="0.01"
                  value={form.meta_mensal}
                  onChange={(e) => setForm({ ...form, meta_mensal: e.target.value })}
                />
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Status</label>
              <input
                style={s.formInput}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={fecharModal}
                style={{ ...s.btnPrimary, backgroundColor: "#f3f4f6", color: "#374151" }}
              >
                Cancelar
              </button>
              <button style={s.btnPrimary} onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}