import { useEffect, useRef, useState } from "react";
import { API_URL } from "../services/api";
import PedidoPrint from "./PedidosPrint";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Cliente  = { id: number; nome: string };
type Vendedor = { id: number; nome: string };
type Produto  = { id: number; name: string; price: number; tamanhos: Record<string, string> };

type PedidoItem = {
  id: number; product_id: number; product_name: string;
  size: string; quantity: number; quantity_separada: number; concluido: boolean; unit_price: number;
};

type Pedido = {
  id: number; cliente_nome: string; vendedor_nome: string;
  status: string; valor_total: number; total_itens: number;
  total_separados: number; created_at: string; observacoes: string | null;
  itens: PedidoItem[];
};

type ItemForm = { product_id: number; size: string; quantity: number; nome: string };

const STATUS_COR: Record<string, string> = {
  "Pendente": "#f59e0b", "Em Separação": "#2563eb",
  "Concluído": "#16a34a", "Cancelado": "#dc2626",
};

// ── Estilos ────────────────────────────────────────────────────────────────────
const s = {
  page:        { fontFamily: "'Segoe UI', sans-serif", color: "#071633" } as React.CSSProperties,
  title:       { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  subtitle:    { color: "#6b7280", marginBottom: "24px" } as React.CSSProperties,
  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  card:        { backgroundColor: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "24px" } as React.CSSProperties,
  toolbar:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" as const, gap: "12px" } as React.CSSProperties,
  select:      { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff" } as React.CSSProperties,
  selectFull:  { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", backgroundColor: "#fff", boxSizing: "border-box" as const } as React.CSSProperties,
  input:       { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  label:       { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  fg:          { marginBottom: "14px" } as React.CSSProperties,
  row:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } as React.CSSProperties,
  btnPrimary:  { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnSecondary:{ backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnDanger:   { backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 } as React.CSSProperties,
  btnSuccess:  { backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  table:       { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px" } as React.CSSProperties,
  th:          { textAlign: "left" as const, padding: "10px 12px", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" } as React.CSSProperties,
  td:          { padding: "12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" as const } as React.CSSProperties,
  overlay:     { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 } as React.CSSProperties,
  modal:       { backgroundColor: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" as const, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" } as React.CSSProperties,
};

// ── Badge de status ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cor = STATUS_COR[status] || "#6b7280";
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: cor + "22", color: cor }}>
      {status}
    </span>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ separados, total }: { separados: number; total: number }) {
  const pct = total > 0 ? Math.min((separados / total) * 100, 100) : 0;
  const cor = pct === 100 ? "#16a34a" : pct > 0 ? "#2563eb" : "#e5e7eb";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, backgroundColor: "#f3f4f6", borderRadius: "999px", height: "8px" }}>
        <div style={{ width: `${pct}%`, backgroundColor: cor, height: "100%", borderRadius: "999px", transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "12px", color: "#6b7280", minWidth: "40px" }}>{separados}/{total}</span>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Pedidos() {
  const [pedidos,    setPedidos]    = useState<Pedido[]>([]);
  const [clientes,   setClientes]   = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [produtos,   setProdutos]   = useState<Produto[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("");

  // Modal novo pedido
  const [modalNovo,      setModalNovo]      = useState(false);
  const [formClienteId,  setFormClienteId]  = useState("");
  const [formVendedorId, setFormVendedorId] = useState("");
  const [formObs,        setFormObs]        = useState("");
  const [formItens,      setFormItens]      = useState<ItemForm[]>([]);
  const [formProdId,     setFormProdId]     = useState("");
  const [formSize,       setFormSize]       = useState("");
  const [formQty,        setFormQty]        = useState(1);
  const [salvando,       setSalvando]       = useState(false);

  // Modal separação
  const [pedidoSeparando, setPedidoSeparando] = useState<Pedido | null>(null);
  const [barcodeInput,    setBarcodeInput]    = useState("");
  const [barcodeMsg,      setBarcodeMsg]      = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // PDF / impressão
  const [pedidoImprimindo, setPedidoImprimindo] = useState<Pedido | null>(null);

  // ── Carregar dados ───────────────────────────────────────────────────────────
  const carregar = async () => {
    setLoading(true);
    try {
      const [rP, rC, rV, rProd] = await Promise.all([
        fetch(`${API_URL}/pedidos/${filtroStatus ? `?status=${filtroStatus}` : ""}`),
        fetch(`${API_URL}/clientes`),
        fetch(`${API_URL}/vendedores/`),
        fetch(`${API_URL}/products/`),
      ]);
      const [jP, jC, jV, jProd] = await Promise.all([rP.json(), rC.json(), rV.json(), rProd.json()]);
      setPedidos(jP.data || []);
      setClientes(Array.isArray(jC) ? jC : jC.data || []);
      setVendedores(jV.data || []);
      setProdutos(jProd.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, [filtroStatus]);

  // ── Novo pedido ──────────────────────────────────────────────────────────────
  const produtoSelecionado = produtos.find(p => String(p.id) === formProdId);

  // Mostra TODOS os tamanhos — com indicação de estoque zerado
  const tamanhosDispo = produtoSelecionado
    ? Object.entries(produtoSelecionado.tamanhos || {})
    : [];

  const adicionarItemForm = () => {
    if (!formProdId || !formSize || formQty <= 0) {
      alert("Selecione produto, tamanho e quantidade."); return;
    }
    const prod = produtos.find(p => String(p.id) === formProdId)!;
    const idx  = formItens.findIndex(i => i.product_id === Number(formProdId) && i.size === formSize);
    if (idx >= 0) {
      const novos = [...formItens];
      novos[idx].quantity += formQty;
      setFormItens(novos);
    } else {
      setFormItens(prev => [...prev, { product_id: Number(formProdId), size: formSize, quantity: formQty, nome: prod.name }]);
    }
    setFormProdId(""); setFormSize(""); setFormQty(1);
  };

  const criarPedido = async () => {
    if (!formClienteId || !formVendedorId || formItens.length === 0) {
      alert("Preencha cliente, vendedor e pelo menos um item."); return;
    }
    setSalvando(true);
    try {
      const res = await fetch(`${API_URL}/pedidos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id:  Number(formClienteId),
          vendedor_id: Number(formVendedorId),
          observacoes: formObs,
          itens: formItens.map(({ product_id, size, quantity }) => ({ product_id, size, quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { alert(json.message || "Erro."); return; }
      setModalNovo(false);
      setFormClienteId(""); setFormVendedorId(""); setFormObs(""); setFormItens([]);
      carregar();
    } finally {
      setSalvando(false);
    }
  };

  // ── Separação ────────────────────────────────────────────────────────────────
  const abrirSeparacao = async (id: number) => {
    const res  = await fetch(`${API_URL}/pedidos/${id}`);
    const json = await res.json();
    setPedidoSeparando(json.data);
    setTimeout(() => barcodeRef.current?.focus(), 100);
  };

  const recarregarPedidoSeparando = async () => {
    if (!pedidoSeparando) return;
    const res  = await fetch(`${API_URL}/pedidos/${pedidoSeparando.id}`);
    const json = await res.json();
    setPedidoSeparando(json.data);
  };

  const bipBarcode = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const barcode = barcodeInput.trim();
    if (!barcode || !pedidoSeparando) return;
    setBarcodeInput("");

    const res  = await fetch(`${API_URL}/pedidos/${pedidoSeparando.id}/baixa-barcode`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode }),
    });
    const json = await res.json();
    if (res.ok) {
      setBarcodeMsg({ tipo: "ok", texto: `✓ ${json.data.product_name} tam. ${json.data.size} — ${json.data.quantity_separada}/${json.data.quantity}` });
    } else {
      setBarcodeMsg({ tipo: "erro", texto: `✗ ${json.message}` });
    }
    setTimeout(() => setBarcodeMsg(null), 3000);
    await recarregarPedidoSeparando();
    barcodeRef.current?.focus();
  };

  const baixaManual = async (itemId: number, productId: number, size: string) => {
    if (!pedidoSeparando) return;
    const res  = await fetch(`${API_URL}/pedidos/${pedidoSeparando.id}/baixa-manual`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, size, quantity: 1 }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.message); return; }
    await recarregarPedidoSeparando();
  };

  // ── PDF ──────────────────────────────────────────────────────────────────────
  const abrirPDF = async (id: number) => {
    const res  = await fetch(`${API_URL}/pedidos/${id}`);
    const json = await res.json();
    setPedidoImprimindo(json.data);
  };

  const cancelarPedido = async (id: number) => {
    if (!confirm("Cancelar este pedido?")) return;
    await fetch(`${API_URL}/pedidos/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Cancelado" }),
    });
    carregar();
  };

  // ── Métricas ─────────────────────────────────────────────────────────────────
  const totalPedidos = pedidos.length;
  const pendentes    = pedidos.filter(p => p.status === "Pendente").length;
  const emSeparacao  = pedidos.filter(p => p.status === "Em Separação").length;
  const totalValor   = pedidos.reduce((a, p) => a + p.valor_total, 0);

  return (
    <div style={s.page}>
      <h1 style={s.title}>Pedidos</h1>
      <p style={s.subtitle}>Controle, acompanhamento e separação de pedidos.</p>

      {/* Cards */}
      <div style={s.grid}>
        {[
          { label: "Total de Pedidos", val: totalPedidos, cor: "#071633" },
          { label: "Pendentes",        val: pendentes,    cor: "#f59e0b" },
          { label: "Em Separação",     val: emSeparacao,  cor: "#2563eb" },
          { label: "Valor Total",      val: `R$ ${totalValor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, cor: "#16a34a" },
        ].map(c => (
          <div key={c.label} style={s.summaryCard(c.cor)}>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>{c.label}</p>
            <h2 style={{ margin: "4px 0 0", fontSize: "1.8rem", fontWeight: 800 }}>{c.val}</h2>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={s.card}>
        <div style={s.toolbar}>
          <h2 style={{ margin: 0, color: "#071633" }}>Lista de Pedidos</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <select style={s.select} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {["Pendente", "Em Separação", "Concluído", "Cancelado"].map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <button style={s.btnPrimary} onClick={() => setModalNovo(true)}>+ Novo Pedido</button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>Carregando...</p>
        ) : pedidos.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>Nenhum pedido encontrado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["#", "Cliente", "Vendedor", "Status", "Progresso", "Valor", "Data", "Ações"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                    style={{ transition: "background 0.15s" }}
                  >
                    <td style={s.td}><span style={{ color: "#6b7280", fontSize: "13px" }}>#{p.id}</span></td>
                    <td style={s.td}><strong>{p.cliente_nome}</strong></td>
                    <td style={s.td}>{p.vendedor_nome}</td>
                    <td style={s.td}><StatusBadge status={p.status} /></td>
                    <td style={{ ...s.td, minWidth: "140px" }}>
                      <ProgressBar separados={p.total_separados} total={p.total_itens} />
                    </td>
                    <td style={s.td}>
                      <strong>R$ {p.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td style={s.td}>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                        {p.status !== "Concluído" && p.status !== "Cancelado" && (
                          <button
                            style={{ ...s.btnPrimary, padding: "5px 10px", fontSize: "12px" }}
                            onClick={() => abrirSeparacao(p.id)}
                          >
                            📦 Separar
                          </button>
                        )}
                        <button
                          style={{ ...s.btnPrimary, padding: "5px 10px", fontSize: "12px", backgroundColor: "#7c3aed" }}
                          onClick={() => abrirPDF(p.id)}
                        >
                          📄 PDF
                        </button>
                        {p.status === "Pendente" && (
                          <button style={s.btnDanger} onClick={() => cancelarPedido(p.id)}>Cancelar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal novo pedido ── */}
      {modalNovo && (
        <div style={s.overlay} onClick={() => setModalNovo(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", color: "#071633" }}>Novo Pedido</h2>

            <div style={s.row}>
              <div style={s.fg}>
                <label style={s.label}>Cliente *</label>
                <select style={s.selectFull} value={formClienteId} onChange={e => setFormClienteId(e.target.value)}>
                  <option value="">Selecione</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div style={s.fg}>
                <label style={s.label}>Vendedor *</label>
                <select style={s.selectFull} value={formVendedorId} onChange={e => setFormVendedorId(e.target.value)}>
                  <option value="">Selecione</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                </select>
              </div>
            </div>

            {/* Adicionar item */}
            <div style={{ backgroundColor: "#f9fafb", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
              <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: "13px" }}>Adicionar item</p>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px auto", gap: "8px", alignItems: "flex-end" }}>
                <div>
                  <label style={s.label}>Produto</label>
                  <select
                    style={s.selectFull}
                    value={formProdId}
                    onChange={e => { setFormProdId(e.target.value); setFormSize(""); }}
                  >
                    <option value="">Selecione</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Tamanho</label>
                  <select
                    style={s.selectFull}
                    value={formSize}
                    onChange={e => setFormSize(e.target.value)}
                    disabled={!formProdId}
                  >
                    <option value="">Tam.</option>
                    {tamanhosDispo.map(([t, q]) => (
                      <option key={t} value={t}>
                        {t} {Number(q) > 0 ? `(est. ${q})` : "(sem estoque)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Qtd.</label>
                  <input
                    style={s.input}
                    type="number"
                    min="1"
                    value={formQty}
                    onChange={e => setFormQty(Number(e.target.value))}
                  />
                </div>
                <button style={{ ...s.btnPrimary, whiteSpace: "nowrap" as const }} onClick={adicionarItemForm}>
                  + Add
                </button>
              </div>
            </div>

            {formItens.length > 0 && (
              <table style={{ ...s.table, marginBottom: "16px" }}>
                <thead>
                  <tr>{["Produto", "Tam.", "Qtd.", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {formItens.map((item, i) => (
                    <tr key={i}>
                      <td style={s.td}>{item.nome}</td>
                      <td style={s.td}>{item.size}</td>
                      <td style={s.td}>{item.quantity}</td>
                      <td style={s.td}>
                        <button
                          style={s.btnDanger}
                          onClick={() => setFormItens(prev => prev.filter((_, j) => j !== i))}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={s.fg}>
              <label style={s.label}>Observações</label>
              <textarea
                style={{ ...s.input, minHeight: "60px", resize: "vertical" }}
                value={formObs}
                onChange={e => setFormObs(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button style={s.btnSecondary} onClick={() => setModalNovo(false)}>Cancelar</button>
              <button style={s.btnPrimary} onClick={criarPedido} disabled={salvando}>
                {salvando ? "Salvando..." : "Criar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal separação ── */}
      {pedidoSeparando && (
        <div style={s.overlay} onClick={() => setPedidoSeparando(null)}>
          <div style={{ ...s.modal, maxWidth: "700px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, color: "#071633" }}>Separação — Pedido #{pedidoSeparando.id}</h2>
                <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
                  {pedidoSeparando.cliente_nome} · {pedidoSeparando.vendedor_nome}
                </p>
              </div>
              <StatusBadge status={pedidoSeparando.status} />
            </div>

            {/* Campo de bipagem */}
            <div style={{ backgroundColor: "#f0f9ff", border: "2px solid #2563eb", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <label style={{ ...s.label, color: "#2563eb" }}>
                📷 Bipe o código de barras (ou digite e pressione Enter)
              </label>
              <input
                ref={barcodeRef}
                style={{ ...s.input, fontSize: "16px", fontFamily: "monospace", letterSpacing: "2px" }}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={bipBarcode}
                placeholder="Aguardando bipagem..."
                autoFocus
              />
              {barcodeMsg && (
                <p style={{ margin: "8px 0 0", fontSize: "14px", fontWeight: 600, color: barcodeMsg.tipo === "ok" ? "#16a34a" : "#dc2626" }}>
                  {barcodeMsg.texto}
                </p>
              )}
            </div>

            {/* Itens do pedido */}
            <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "10px", color: "#374151" }}>
              Itens do pedido:
            </p>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Produto", "Tam.", "Progresso", "Baixa Manual"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pedidoSeparando.itens.map(item => (
                  <tr key={item.id} style={{ backgroundColor: item.concluido ? "#f0fdf4" : "transparent" }}>
                    <td style={s.td}>
                      <strong style={{ color: item.concluido ? "#16a34a" : "#071633" }}>
                        {item.product_name}
                      </strong>
                      {item.concluido && <span style={{ marginLeft: "6px", fontSize: "12px" }}>✓</span>}
                    </td>
                    <td style={s.td}>{item.size}</td>
                    <td style={{ ...s.td, minWidth: "140px" }}>
                      <ProgressBar separados={item.quantity_separada} total={item.quantity} />
                    </td>
                    <td style={s.td}>
                      {!item.concluido && (
                        <button
                          style={{ ...s.btnPrimary, padding: "4px 12px", fontSize: "12px" }}
                          onClick={() => baixaManual(item.id, item.product_id, item.size)}
                        >
                          +1 Manual
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
              <ProgressBar
                separados={pedidoSeparando.total_separados}
                total={pedidoSeparando.total_itens}
              />
              <button style={s.btnSecondary} onClick={() => { setPedidoSeparando(null); carregar(); }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PDF / Impressão ── */}
      {pedidoImprimindo && (
        <PedidoPrint
          pedido={pedidoImprimindo}
          onClose={() => setPedidoImprimindo(null)}
        />
      )}
    </div>
  );
}