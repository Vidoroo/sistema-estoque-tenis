import { useEffect, useState } from "react";
import { API_URL } from "../services/api";

// Bibliotecas de exportacao carregadas via CDN (sem instalar nada no projeto).
declare global {
  interface Window {
    jspdf: any;
    XLSX: any;
  }
}

type VendaLinha = {
  id: number;
  data: string | null;
  cliente_nome: string;
  vendedor_id: number;
  vendedor_nome: string;
  valor_total: number;
  valor_comissao: number;
  pedido_id: number | null;
};
type PorVendedor = {
  vendedor_id: number;
  vendedor_nome: string;
  qtd_vendas: number;
  valor_total: number;
  valor_comissao: number;
};
type Relatorio = {
  periodo: string;
  vendas: VendaLinha[];
  resumo: { qtd_vendas: number; total_valor: number; total_comissao: number };
  por_vendedor: PorVendedor[];
};
type Vendedor = { id: number; nome: string };

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "-";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Carrega um script externo uma unica vez
function carregarScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.body.appendChild(el);
  });
}

const s = {
  page: { fontFamily: "'Segoe UI', sans-serif", color: "#071633", padding: "8px" } as React.CSSProperties,
  title: { fontSize: "2.2rem", fontWeight: 800, color: "#071633", marginBottom: "4px" } as React.CSSProperties,
  sub: { color: "#6b7280", marginBottom: "20px" } as React.CSSProperties,
  card: { backgroundColor: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", marginBottom: "20px" } as React.CSSProperties,
  summaryCard: (color: string) => ({ backgroundColor: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: `4px solid ${color}` } as React.CSSProperties),
  label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" } as React.CSSProperties,
  select: { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", backgroundColor: "#fff" } as React.CSSProperties,
  input: { padding: "9px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", backgroundColor: "#fff" } as React.CSSProperties,
  btnPrimary: { backgroundColor: "#071633", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnPdf: { backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  btnXls: { backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: "pointer", fontWeight: 600, fontSize: "14px" } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "10px 12px", fontSize: "12px", color: "#6b7280", borderBottom: "2px solid #e5e7eb", textTransform: "uppercase" as const },
  td: { padding: "10px 12px", fontSize: "14px", borderBottom: "1px solid #f3f4f6" },
  tab: (ativo: boolean) => ({ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", border: "1px solid #d1d5db", backgroundColor: ativo ? "#071633" : "#fff", color: ativo ? "#fff" : "#374151" } as React.CSSProperties),
};

export default function Relatorios() {
  const hoje = new Date();
  const [modo, setModo] = useState<"mes" | "intervalo">("mes");
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  const [rel, setRel] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/vendedores/`)
      .then((r) => r.json())
      .then((j) => setVendedores((j.data || []).map((v: any) => ({ id: v.id, nome: v.nome }))))
      .catch(() => {});
  }, []);

  const gerar = async () => {
    setErro("");
    setCarregando(true);
    setRel(null);
    try {
      const p = new URLSearchParams();
      if (modo === "mes") {
        p.set("mes", String(mes));
        p.set("ano", String(ano));
      } else {
        if (!dataInicio || !dataFim) {
          setErro("Selecione as duas datas.");
          setCarregando(false);
          return;
        }
        p.set("data_inicio", dataInicio);
        p.set("data_fim", dataFim);
      }
      if (vendedorId) p.set("vendedor_id", vendedorId);

      const res = await fetch(`${API_URL}/relatorios/vendas?${p.toString()}`);
      const j = await res.json();
      if (!res.ok) {
        setErro(j.message || j.error || "Erro ao gerar relatorio.");
      } else {
        setRel(j.data);
      }
    } catch (e: any) {
      setErro("Falha de conexao ao gerar o relatorio.");
    } finally {
      setCarregando(false);
    }
  };

  // ── Exportar Excel ──────────────────────────────────────────────
  const exportarExcel = async () => {
    if (!rel) return;
    await carregarScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
    const XLSX = window.XLSX;

    const wb = XLSX.utils.book_new();

    // Aba 1: Vendas
    const linhasVendas = rel.vendas.map((v) => ({
      Data: dataBR(v.data),
      Cliente: v.cliente_nome,
      Vendedor: v.vendedor_nome,
      "Valor (R$)": v.valor_total,
      "Comissão (R$)": v.valor_comissao,
      Pedido: v.pedido_id ?? "",
    }));
    const ws1 = XLSX.utils.json_to_sheet(linhasVendas);
    XLSX.utils.book_append_sheet(wb, ws1, "Vendas");

    // Aba 2: Por vendedor
    const linhasVend = rel.por_vendedor.map((v) => ({
      Vendedor: v.vendedor_nome,
      "Qtd. Vendas": v.qtd_vendas,
      "Total (R$)": v.valor_total,
      "Comissão (R$)": v.valor_comissao,
    }));
    const ws2 = XLSX.utils.json_to_sheet(linhasVend);
    XLSX.utils.book_append_sheet(wb, ws2, "Por Vendedor");

    XLSX.writeFile(wb, `relatorio-vendas-${rel.periodo.replace(/[^\w]+/g, "-")}.xlsx`);
  };

  // ── Exportar PDF ────────────────────────────────────────────────
  const exportarPdf = async () => {
    if (!rel) return;
    await carregarScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await carregarScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Relatório de Vendas", 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: ${rel.periodo}`, 14, 26);
    doc.text(
      `Total: ${brl(rel.resumo.total_valor)}  |  ${rel.resumo.qtd_vendas} vendas  |  Comissão: ${brl(rel.resumo.total_comissao)}`,
      14, 33
    );

    (doc as any).autoTable({
      startY: 40,
      head: [["Data", "Cliente", "Vendedor", "Valor", "Comissão"]],
      body: rel.vendas.map((v) => [
        dataBR(v.data), v.cliente_nome, v.vendedor_nome, brl(v.valor_total), brl(v.valor_comissao),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [7, 22, 51] },
    });

    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text("Total por Vendedor", 14, y);
    (doc as any).autoTable({
      startY: y + 4,
      head: [["Vendedor", "Qtd.", "Total", "Comissão"]],
      body: rel.por_vendedor.map((v) => [
        v.vendedor_nome, String(v.qtd_vendas), brl(v.valor_total), brl(v.valor_comissao),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [7, 22, 51] },
    });

    doc.save(`relatorio-vendas-${rel.periodo.replace(/[^\w]+/g, "-")}.pdf`);
  };

  const anos: number[] = [];
  for (let a = hoje.getFullYear(); a >= hoje.getFullYear() - 4; a--) anos.push(a);

  return (
    <div style={s.page}>
      <h1 style={s.title}>Relatório de Vendas</h1>
      <p style={s.sub}>Filtre por período e exporte em PDF ou Excel.</p>

      {/* Filtros */}
      <div style={s.card}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button style={s.tab(modo === "mes")} onClick={() => setModo("mes")}>Por mês</button>
          <button style={s.tab(modo === "intervalo")} onClick={() => setModo("intervalo")}>Por intervalo de datas</button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
          {modo === "mes" ? (
            <>
              <div>
                <label style={s.label}>Mês</label>
                <select style={s.select} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                  {MESES.map((m, i) => (<option key={i} value={i + 1}>{m}</option>))}
                </select>
              </div>
              <div>
                <label style={s.label}>Ano</label>
                <select style={s.select} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
                  {anos.map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={s.label}>De</label>
                <input type="date" style={s.input} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Até</label>
                <input type="date" style={s.input} value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <label style={s.label}>Vendedor</label>
            <select style={s.select} value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
              <option value="">Todos</option>
              {vendedores.map((v) => (<option key={v.id} value={v.id}>{v.nome}</option>))}
            </select>
          </div>

          <button style={s.btnPrimary} onClick={gerar} disabled={carregando}>
            {carregando ? "Gerando..." : "Gerar relatório"}
          </button>
        </div>
        {erro && <p style={{ color: "#dc2626", marginTop: "12px", marginBottom: 0 }}>{erro}</p>}
      </div>

      {rel && (
        <>
          {/* Resumo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div style={s.summaryCard("#071633")}>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Período</div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>{rel.periodo}</div>
            </div>
            <div style={s.summaryCard("#16a34a")}>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Total Vendido</div>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>{brl(rel.resumo.total_valor)}</div>
            </div>
            <div style={s.summaryCard("#2563eb")}>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Nº de Vendas</div>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>{rel.resumo.qtd_vendas}</div>
            </div>
            <div style={s.summaryCard("#d97706")}>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "6px" }}>Total Comissão</div>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>{brl(rel.resumo.total_comissao)}</div>
            </div>
          </div>

          {/* Botoes de exportacao */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button style={s.btnPdf} onClick={exportarPdf}>Exportar PDF</button>
            <button style={s.btnXls} onClick={exportarExcel}>Exportar Excel</button>
          </div>

          {/* Total por vendedor */}
          <div style={s.card}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: 0, marginBottom: "12px" }}>Total por Vendedor</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Vendedor</th>
                    <th style={s.th}>Qtd. Vendas</th>
                    <th style={s.th}>Total</th>
                    <th style={s.th}>Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {rel.por_vendedor.map((v) => (
                    <tr key={v.vendedor_id}>
                      <td style={s.td}>{v.vendedor_nome}</td>
                      <td style={s.td}>{v.qtd_vendas}</td>
                      <td style={s.td}><strong>{brl(v.valor_total)}</strong></td>
                      <td style={s.td}>{brl(v.valor_comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lista de vendas */}
          <div style={s.card}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: 0, marginBottom: "12px" }}>
              Vendas do Período ({rel.vendas.length})
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Data</th>
                    <th style={s.th}>Cliente</th>
                    <th style={s.th}>Vendedor</th>
                    <th style={s.th}>Valor</th>
                    <th style={s.th}>Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {rel.vendas.length === 0 ? (
                    <tr><td style={s.td} colSpan={5}>Nenhuma venda no período.</td></tr>
                  ) : (
                    rel.vendas.map((v) => (
                      <tr key={v.id}>
                        <td style={s.td}>{dataBR(v.data)}</td>
                        <td style={s.td}>{v.cliente_nome}</td>
                        <td style={s.td}>{v.vendedor_nome}</td>
                        <td style={s.td}><strong>{brl(v.valor_total)}</strong></td>
                        <td style={s.td}>{brl(v.valor_comissao)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}