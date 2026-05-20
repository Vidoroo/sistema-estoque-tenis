import { useEffect, useMemo, useRef, useState } from "react";
import {
  criarProduto,
  editarProduto,
  excluirProduto,
  listarProdutos,
  type ProdutoPayload,
} from "../services/api";

const CLOUDINARY_CLOUD = "daxx6a9pw";
const CLOUDINARY_PRESET = "estoque_tenis";

type Produto = ProdutoPayload & {
  id: number;
  codigo?: string;
  preco_atacado?: number;
  preco_dropshipping?: number;
  preco_varejo?: number;
  nota_fiscal?: string;
  serie_nf?: string;
  data_emissao?: string;
  fornecedor?: string;
  chave_acesso?: string;
  observacoes_nf?: string;
  tamanhos?: Record<string, string>;
};

const TAMANHOS_VAZIOS: Record<string, string> = {
  "34": "", "35": "", "36": "", "37": "", "38": "",
  "39": "", "40": "", "41": "", "42": "", "43": "", "44": "",
};

const EMPTY_FORM = {
  codigo: "",
  name: "",
  category: "",
  quantity: "",
  price: "",
  image: "",
  preco_atacado: "",
  preco_dropshipping: "",
  preco_varejo: "",
  nota_fiscal: "",
  serie_nf: "",
  data_emissao: "",
  fornecedor: "",
  chave_acesso: "",
  observacoes_nf: "",
  tamanhos: { ...TAMANHOS_VAZIOS },
};

const s = {
  page: { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title: { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle: { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card: { backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" } as React.CSSProperties,
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  input: { padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", width: "260px" } as React.CSSProperties,
  btnPrimary: { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger: { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  btnEdit: { backgroundColor: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  td: { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
  overlay: { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modal: { backgroundColor: "#fff", borderRadius: "14px", padding: "32px", width: "100%", maxWidth: "760px", maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } as React.CSSProperties,
  formGroup: { marginBottom: "16px" } as React.CSSProperties,
  sectionTitle: { margin: "20px 0 12px", color: "#071633", fontSize: "1.05rem", fontWeight: 700 } as React.CSSProperties,
  label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  formInput: { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" as const, outline: "none" } as React.CSSProperties,
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } as React.CSSProperties,
  imgThumb: { width: "48px", height: "48px", objectFit: "cover" as const, borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: "#f9fafb" } as React.CSSProperties,
  tamanhosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "12px", marginBottom: "16px" } as React.CSSProperties,
};

function toNumber(value: string | number | undefined | null) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

function calcularQuantidadeTotal(tamanhos: Record<string, string>) {
  return Object.values(tamanhos).reduce((total, valor) => total + Number(valor || 0), 0);
}

function formatarDataBR(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
}

function CampoPrecoComLucro({
  label, value, onChange, precoBase,
}: {
  label: string; value: string; onChange: (v: string) => void; precoBase: number;
}) {
  const preco = toNumber(value);
  const lucroReais = precoBase > 0 && preco > 0 ? preco - precoBase : null;
  const lucroPct = precoBase > 0 && preco > 0 ? ((preco - precoBase) / precoBase) * 100 : null;
  const corLucro = lucroReais === null ? "#9ca3af" : lucroReais >= 0 ? "#16a34a" : "#dc2626";

  return (
    <div>
      <label style={s.label}>{label}</label>
      <input style={s.formInput} type="number" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0,00" />
      {precoBase > 0 && preco > 0 && lucroReais !== null && (
        <div style={{ marginTop: "5px", fontSize: "12px", fontWeight: 600, color: corLucro, display: "flex", gap: "8px" }}>
          <span>Lucro: R$ {lucroReais.toFixed(2)}</span>
          <span>({lucroPct!.toFixed(1)}%)</span>
        </div>
      )}
      {precoBase === 0 && (
        <div style={{ marginTop: "5px", fontSize: "12px", color: "#9ca3af" }}>Informe o Custo para calcular o lucro</div>
      )}
    </div>
  );
}

function UploadImagem({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        onChange(data.secure_url);
      } else {
        alert("Erro ao fazer upload da imagem.");
      }
    } catch {
      alert("Erro ao conectar com o Cloudinary.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label style={s.label}>Imagem do Produto</label>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {value ? (
          <img src={value} alt="preview" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
        ) : (
          <div style={{ width: "64px", height: "64px", borderRadius: "8px", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
            👟
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <button
            type="button"
            style={{ ...s.btnEdit, padding: "7px 14px" }}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Enviando..." : value ? "Trocar Imagem" : "Adicionar Imagem"}
          </button>
          {value && (
            <button
              type="button"
              style={{ ...s.btnDanger, padding: "5px 10px", fontSize: "12px" }}
              onClick={() => onChange("")}
            >
              Remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
    </div>
  );
}

export default function CadastroProduto() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchProdutos = async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarProdutos();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar produtos.");
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProdutos(); }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return produtos.filter((p) =>
      p.name?.toLowerCase().includes(termo) ||
      p.category?.toLowerCase().includes(termo) ||
      p.codigo?.toLowerCase().includes(termo) ||
      p.nota_fiscal?.toLowerCase().includes(termo)
    );
  }, [produtos, busca]);

  const abrirCadastro = () => {
    setEditando(null);
    setForm({ ...EMPTY_FORM, tamanhos: { ...TAMANHOS_VAZIOS } });
    setModalAberto(true);
  };

  const abrirEdicao = (p: Produto) => {
    setEditando(p);
    setForm({
      codigo: p.codigo || "",
      name: p.name || "",
      category: p.category || "",
      quantity: String(p.quantity ?? 0),
      price: p.price != null && toNumber(p.price) !== 0 ? String(p.price) : "",
      image: p.image || "",
      preco_atacado: p.preco_atacado != null && toNumber(p.preco_atacado) !== 0 ? String(p.preco_atacado) : "",
      preco_dropshipping: p.preco_dropshipping != null && toNumber(p.preco_dropshipping) !== 0 ? String(p.preco_dropshipping) : "",
      preco_varejo: p.preco_varejo != null && toNumber(p.preco_varejo) !== 0 ? String(p.preco_varejo) : "",
      nota_fiscal: p.nota_fiscal || "",
      serie_nf: p.serie_nf || "",
      data_emissao: p.data_emissao || "",
      fornecedor: p.fornecedor || "",
      chave_acesso: p.chave_acesso || "",
      observacoes_nf: p.observacoes_nf || "",
      tamanhos: {
        "34": p.tamanhos?.["34"] || "", "35": p.tamanhos?.["35"] || "",
        "36": p.tamanhos?.["36"] || "", "37": p.tamanhos?.["37"] || "",
        "38": p.tamanhos?.["38"] || "", "39": p.tamanhos?.["39"] || "",
        "40": p.tamanhos?.["40"] || "", "41": p.tamanhos?.["41"] || "",
        "42": p.tamanhos?.["42"] || "", "43": p.tamanhos?.["43"] || "",
        "44": p.tamanhos?.["44"] || "",
      },
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setForm({ ...EMPTY_FORM, tamanhos: { ...TAMANHOS_VAZIOS } });
  };

  const salvar = async () => {
    if (!form.name.trim()) { alert("O nome do produto e obrigatorio."); return; }
    if (!form.category.trim()) { alert("A categoria e obrigatoria."); return; }
    setSalvando(true);
    try {
      const payload: ProdutoPayload = {
        codigo: form.codigo || undefined,
        name: form.name,
        category: form.category,
        quantity: calcularQuantidadeTotal(form.tamanhos),
        price: toNumber(form.price),
        image: form.image || undefined,
        preco_atacado: toNumber(form.preco_atacado),
        preco_dropshipping: toNumber(form.preco_dropshipping),
        preco_varejo: toNumber(form.preco_varejo),
        nota_fiscal: form.nota_fiscal || undefined,
        serie_nf: form.serie_nf || undefined,
        data_emissao: form.data_emissao || undefined,
        fornecedor: form.fornecedor || undefined,
        chave_acesso: form.chave_acesso || undefined,
        observacoes_nf: form.observacoes_nf || undefined,
        tamanhos: form.tamanhos,
      };
      if (editando) { await editarProduto(editando.id, payload); }
      else { await criarProduto(payload); }
      fecharModal();
      await fetchProdutos();
    } catch (e: unknown) {
      console.error("Erro ao salvar produto:", e);
      alert(e instanceof Error ? e.message : "Erro ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (p: Produto) => {
    if (!confirm(`Excluir o produto "${p.name}"?`)) return;
    try {
      await excluirProduto(p.id);
      await fetchProdutos();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir produto.");
    }
  };

  const totalProdutos = produtos.length;
  const semEstoque = produtos.filter((p) => Number(p.quantity) === 0).length;
  const baixoEstoque = produtos.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= 5).length;
  const precoBase = toNumber(form.price);

  return (
    <div style={s.page}>
      <h1 style={s.title}>Cadastro de Produtos</h1>
      <p style={s.subtitle}>Cadastro, consulta e gerenciamento de produtos.</p>

      <div style={s.grid}>
        <div style={s.summaryCard("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Total de Produtos</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{totalProdutos}</h2>
        </div>
        <div style={s.summaryCard("#2563eb")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Baixo Estoque</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{baixoEstoque}</h2>
        </div>
        <div style={s.summaryCard("#16a34a")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>Sem Estoque</p>
          <h2 style={{ margin: "4px 0 0", fontSize: "2rem", fontWeight: 800 }}>{semEstoque}</h2>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Produtos</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              style={s.input}
              placeholder="Buscar por codigo, nome, categoria ou NF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button style={s.btnPrimary} onClick={abrirCadastro}>+ Novo Produto</button>
          </div>
        </div>

        {erro && <p style={{ color: "#dc2626", marginBottom: "12px" }}>{erro}</p>}

        {loading ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>Carregando...</p>
        ) : produtosFiltrados.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "32px" }}>
            {busca ? "Nenhum produto encontrado." : "Nenhum produto cadastrado ainda."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Cod.</th>
                  <th style={s.th}>Img</th>
                  <th style={s.th}>Produto</th>
                  <th style={s.th}>Categoria</th>
                  <th style={s.th}>Qtd</th>
                  <th style={{ ...s.th, color: "#374151" }}>Custo</th>
                  <th style={{ ...s.th, color: "#7c3aed" }}>Drop</th>
                  <th style={{ ...s.th, color: "#b45309" }}>Atacado</th>
                  <th style={{ ...s.th, color: "#16a34a" }}>Varejo</th>
                  <th style={s.th}>NF</th>
                  <th style={s.th}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td style={s.td}><strong>{p.codigo || "-"}</strong></td>
                    <td style={s.td}>
                      {p.image ? <img src={p.image} alt={p.name} style={s.imgThumb} /> : <div style={s.imgThumb} />}
                    </td>
                    <td style={s.td}><strong>{p.name}</strong></td>
                    <td style={s.td}>{p.category}</td>
                    <td style={s.td}>{p.quantity}</td>
                    <td style={s.td}><span style={{ fontSize: "13px", color: "#374151" }}>R$ {toNumber(p.price).toFixed(2)}</span></td>
                    <td style={s.td}><span style={{ fontSize: "13px", color: "#7c3aed" }}>R$ {toNumber(p.preco_dropshipping).toFixed(2)}</span></td>
                    <td style={s.td}><span style={{ fontSize: "13px", color: "#b45309" }}>R$ {toNumber(p.preco_atacado).toFixed(2)}</span></td>
                    <td style={s.td}><span style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>R$ {toNumber(p.preco_varejo).toFixed(2)}</span></td>
                    <td style={s.td}>{p.nota_fiscal || "-"}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button style={s.btnEdit} onClick={() => abrirEdicao(p)}>Editar</button>
                        <button style={s.btnDanger} onClick={() => excluir(p)}>Excluir</button>
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
              {editando ? "Editar Produto" : "Novo Produto"}
            </h2>

            <div style={s.sectionTitle}>Dados do Produto</div>

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <div>
                <label style={s.label}>Codigo (4 digitos)</label>
                <input
                  style={s.formInput}
                  maxLength={4}
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  placeholder="Ex: 1025"
                />
              </div>
              <div>
                <label style={s.label}>Custo (preco de compra) *</label>
                <input
                  style={{ ...s.formInput, borderColor: "#071633", borderWidth: "2px", fontWeight: 600 }}
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0,00"
                />
                {precoBase > 0 && (
                  <div style={{ marginTop: "5px", fontSize: "12px", color: "#071633", fontWeight: 600 }}>
                    Custo: R$ {precoBase.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Nome do Produto *</label>
              <input
                style={s.formInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Tenis Nike Air"
              />
            </div>

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <div>
                <label style={s.label}>Categoria *</label>
                <input
                  style={s.formInput}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: Corrida"
                />
              </div>
              <div>
                <UploadImagem
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                />
              </div>
            </div>

            <div style={s.sectionTitle}>Precos de Venda e Lucro</div>

            {precoBase === 0 && (
              <div style={{ backgroundColor: "#fef9c3", border: "1px solid #fde047", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#854d0e", fontWeight: 500 }}>
                Preencha o <strong>Custo</strong> acima para ver o lucro calculado automaticamente.
              </div>
            )}

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <CampoPrecoComLucro
                label="Dropshipping (lojas que usam seu estoque)"
                value={form.preco_dropshipping}
                onChange={(v) => setForm({ ...form, preco_dropshipping: v })}
                precoBase={precoBase}
              />
              <CampoPrecoComLucro
                label="Atacado (lojas, acima de 6 pares)"
                value={form.preco_atacado}
                onChange={(v) => setForm({ ...form, preco_atacado: v })}
                precoBase={precoBase}
              />
            </div>

            <div style={s.formGroup}>
              <CampoPrecoComLucro
                label="Varejo (pessoa fisica)"
                value={form.preco_varejo}
                onChange={(v) => setForm({ ...form, preco_varejo: v })}
                precoBase={precoBase}
              />
            </div>

            <div style={s.sectionTitle}>Nota Fiscal</div>

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <div>
                <label style={s.label}>Numero da Nota</label>
                <input style={s.formInput} value={form.nota_fiscal} onChange={(e) => setForm({ ...form, nota_fiscal: e.target.value })} placeholder="Ex: 12345" />
              </div>
              <div>
                <label style={s.label}>Serie</label>
                <input style={s.formInput} value={form.serie_nf} onChange={(e) => setForm({ ...form, serie_nf: e.target.value })} placeholder="Ex: 1" />
              </div>
            </div>

            <div style={{ ...s.formGroup, ...s.formRow }}>
              <div>
                <label style={s.label}>Data de Emissao</label>
                <input
                  style={s.formInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.data_emissao}
                  onChange={(e) => setForm({ ...form, data_emissao: formatarDataBR(e.target.value) })}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <div>
                <label style={s.label}>Fornecedor</label>
                <input style={s.formInput} value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} placeholder="Ex: Adidas" />
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Chave de Acesso</label>
              <input style={s.formInput} value={form.chave_acesso} onChange={(e) => setForm({ ...form, chave_acesso: e.target.value })} placeholder="Digite a chave da NF" />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Observacoes da Nota</label>
              <textarea
                style={{ ...s.formInput, minHeight: "72px", resize: "vertical" }}
                value={form.observacoes_nf}
                onChange={(e) => setForm({ ...form, observacoes_nf: e.target.value })}
                placeholder="Observacoes adicionais"
              />
            </div>

            <div style={s.sectionTitle}>Numeros Disponiveis</div>

            <div style={s.tamanhosGrid}>
              {Object.keys(form.tamanhos).map((numero) => (
                <div key={numero}>
                  <label style={s.label}>Nr {numero}</label>
                  <input
                    style={s.formInput}
                    type="number"
                    min="0"
                    value={form.tamanhos[numero as keyof typeof form.tamanhos]}
                    onChange={(e) => setForm({ ...form, tamanhos: { ...form.tamanhos, [numero]: e.target.value } })}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Quantidade Total</label>
              <input style={{ ...s.formInput, backgroundColor: "#f9fafb" }} value={calcularQuantidadeTotal(form.tamanhos)} readOnly />
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
