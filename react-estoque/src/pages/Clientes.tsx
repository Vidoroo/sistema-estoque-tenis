import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  observacoes: string | null;
  created_at?: string | null;
}

const EMPTY_FORM: Omit<Cliente, "id" | "created_at"> = {
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  email: "",
  endereco: "",
  cidade: "",
  observacoes: "",
};

// ── Estilos ────────────────────────────────────────────────────────────────────
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

async function tratarResposta(response: Response) {
  const texto = await response.text();

  if (!response.ok) {
    throw new Error(texto || `Erro HTTP ${response.status}`);
  }

  return texto ? JSON.parse(texto) : null;
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    setErro(null);

    try {
      const res = await fetch(`${API_URL}/clientes`);
      const json = await tratarResposta(res);
      const lista = Array.isArray(json) ? json : [];
      setClientes(lista);
    } catch {
      setErro("Erro ao carregar clientes.");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const termo = busca.toLowerCase();

    return (
      c.nome?.toLowerCase().includes(termo) ||
      c.email?.toLowerCase().includes(termo) ||
      c.cidade?.toLowerCase().includes(termo)
    );
  });

  const abrirCadastro = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setModalAberto(true);
  };

  const abrirEdicao = (c: Cliente) => {
    setEditando(c);
    setForm({
      nome: c.nome,
      cpf_cnpj: c.cpf_cnpj ?? "",
      telefone: c.telefone ?? "",
      email: c.email ?? "",
      endereco: c.endereco ?? "",
      cidade: c.cidade ?? "",
      observacoes: c.observacoes ?? "",
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

    try {
      const url = editando
        ? `${API_URL}/clientes/${editando.id}`
        : `${API_URL}/clientes`;

      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      await tratarResposta(res);

      fecharModal();
      await fetchClientes();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (c: Cliente) => {
    if (!confirm(`Excluir o cliente "${c.nome}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/clientes/${c.id}`, {
        method: "DELETE",
      });

      await tratarResposta(res);
      await fetchClientes();
    } catch {
      alert("Erro ao excluir.");
    }
  };

  const totalClientes = clientes.length;
  const novosNoMes = 0;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Clientes</h1>
      <p style={s.subtitle}>Cadastro, consulta e gerenciamento de clientes.</p>

      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Total de Clientes
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {totalClientes}
          </h2>
        </div>

        <div style={s.summaryCard("#2563eb")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Com E-mail
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {clientes.filter((c) => c.email).length}
          </h2>
        </div>

        <div style={s.summaryCard("#16a34a")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Novos no Mês
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {novosNoMes}
          </h2>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Clientes</h2>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              style={s.input}
              placeholder="Buscar por nome, e-mail, cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button style={s.btnPrimary} onClick={abrirCadastro}>
              + Novo Cliente
            </button>
          </div>
        </div>

        {erro && (
          <p style={{ color: "#dc2626", marginBottom: "12px" }}>{erro}</p>
        )}

        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>
            Carregando...
          </p>
        ) : clientesFiltrados.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>
            {busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Nome", "CPF/CNPJ", "Telefone", "E-mail", "Cidade", "Ações"].map((h) => (
                    <th key={h} style={s.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c) => (
                  <tr
                    key={c.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={s.td}>
                      <strong>{c.nome}</strong>
                    </td>
                    <td style={s.td}>{c.cpf_cnpj ?? "—"}</td>
                    <td style={s.td}>{c.telefone ?? "—"}</td>
                    <td style={s.td}>{c.email ?? "—"}</td>
                    <td style={s.td}>{c.cidade ?? "—"}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={s.btnEdit} onClick={() => abrirEdicao(c)}>
                          Editar
                        </button>
                        <button style={s.btnDanger} onClick={() => excluir(c)}>
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
              {editando ? "Editar Cliente" : "Novo Cliente"}
            </h2>

            <div style={s.formGroup}>
              <label style={s.label}>Nome *</label>
              <input
                style={s.formInput}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo ou razão social"
              />
            </div>

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <div>
                <label style={s.label}>CPF / CNPJ</label>
                <input
                  style={s.formInput}
                  value={form.cpf_cnpj ?? ""}
                  onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label style={s.label}>Telefone</label>
                <input
                  style={s.formInput}
                  value={form.telefone ?? ""}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>E-mail</label>
              <input
                style={s.formInput}
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <div>
                <label style={s.label}>Endereço</label>
                <input
                  style={s.formInput}
                  value={form.endereco ?? ""}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  placeholder="Rua, número"
                />
              </div>
              <div>
                <label style={s.label}>Cidade</label>
                <input
                  style={s.formInput}
                  value={form.cidade ?? ""}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Observações</label>
              <textarea
                style={{ ...s.formInput, minHeight: "72px", resize: "vertical" }}
                value={form.observacoes ?? ""}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Informações adicionais..."
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={fecharModal}
                style={{
                  ...s.btnPrimary,
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                }}
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