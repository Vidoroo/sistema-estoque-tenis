import { useEffect, useRef } from "react";

type PedidoItem = {
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  quantity_separada?: number;
};

type PedidoData = {
  id: number;
  cliente_nome: string;
  vendedor_nome: string;
  status: string;
  observacoes: string | null;
  valor_total: number;
  created_at: string;
  itens: PedidoItem[];
};

type Props = {
  pedido: PedidoData;
  onClose: () => void;
  nomeEmpresa?: string;
};

export default function PedidoPrint({ pedido, onClose, nomeEmpresa = "Estoque de Tênis" }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const imprimir = () => {
    const conteudo = printRef.current?.innerHTML;
    if (!conteudo) return;

    const janela = window.open("", "_blank", "width=800,height=900");
    if (!janela) return;

    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Pedido #${pedido.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
            color: #111;
            background: #fff;
            padding: 32px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #071633;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .empresa-nome {
            font-size: 22px;
            font-weight: 800;
            color: #071633;
          }
          .empresa-sub {
            font-size: 12px;
            color: #666;
            margin-top: 2px;
          }
          .pedido-numero {
            text-align: right;
          }
          .pedido-numero h2 {
            font-size: 20px;
            font-weight: 800;
            color: #071633;
          }
          .pedido-numero p {
            font-size: 12px;
            color: #666;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
          }
          .info-box {
            background: #f8fafc;
            border-radius: 8px;
            padding: 14px 16px;
            border-left: 4px solid #071633;
          }
          .info-box h4 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #888;
            margin-bottom: 6px;
          }
          .info-box p {
            font-size: 14px;
            font-weight: 600;
            color: #111;
          }
          .info-box .sub {
            font-size: 12px;
            font-weight: 400;
            color: #555;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          thead tr {
            background: #071633;
            color: #fff;
          }
          thead th {
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.04em;
          }
          thead th:last-child,
          thead th:nth-last-child(2) {
            text-align: right;
          }
          tbody tr:nth-child(even) { background: #f8fafc; }
          tbody tr:last-child td { border-bottom: 2px solid #071633; }
          tbody td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
          }
          tbody td:last-child,
          tbody td:nth-last-child(2) {
            text-align: right;
          }
          .totais {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 24px;
          }
          .totais-box {
            min-width: 260px;
          }
          .totais-linha {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
            color: #555;
          }
          .totais-linha.total {
            font-size: 16px;
            font-weight: 800;
            color: #071633;
            border-bottom: none;
            padding-top: 10px;
          }
          .obs-box {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
          }
          .obs-box h4 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #92400e;
            margin-bottom: 4px;
          }
          .obs-box p {
            font-size: 13px;
            color: #78350f;
          }
          .assinatura {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 48px;
          }
          .assinatura-linha {
            border-top: 1px solid #aaa;
            padding-top: 8px;
            font-size: 12px;
            color: #555;
            text-align: center;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            background: #dcfce7;
            color: #166534;
          }
          .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 11px;
            color: #aaa;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
          }
          @media print {
            body { padding: 20px; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>
        ${conteudo}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    janela.document.close();
  };

  const dataFormatada = new Date(pedido.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const subtotal = pedido.itens.reduce((acc, i) => acc + i.unit_price * i.quantity, 0);
  const totalItens = pedido.itens.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <>
      {/* Overlay de preview */}
      <div style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: "24px",
      }}>
        <div style={{
          backgroundColor: "#fff", borderRadius: "14px", width: "100%",
          maxWidth: "760px", maxHeight: "90vh", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}>
          {/* Barra de ações */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 24px", borderBottom: "1px solid #e5e7eb",
          }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#071633" }}>
              📄 Preview — Pedido #{pedido.id}
            </h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 16px", borderRadius: "8px", border: "none",
                  backgroundColor: "#f3f4f6", color: "#374151", cursor: "pointer",
                  fontWeight: 600, fontSize: "14px",
                }}
              >
                Fechar
              </button>
              <button
                onClick={imprimir}
                style={{
                  padding: "8px 20px", borderRadius: "8px", border: "none",
                  backgroundColor: "#071633", color: "#fff", cursor: "pointer",
                  fontWeight: 600, fontSize: "14px",
                }}
              >
                🖨️ Imprimir / Salvar PDF
              </button>
            </div>
          </div>

          {/* Preview scrollável */}
          <div style={{ overflowY: "auto", padding: "24px", flex: 1 }}>
            <div ref={printRef} style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: "13px", color: "#111" }}>

              {/* Cabeçalho */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #071633", paddingBottom: "16px", marginBottom: "24px" }}>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#071633" }}>👟 {nomeEmpresa}</div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>Pedido de Compra</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#071633" }}>Pedido #{pedido.id}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{dataFormatada}</div>
                  <span style={{
                    display: "inline-block", marginTop: "4px", padding: "3px 10px",
                    borderRadius: "999px", fontSize: "11px", fontWeight: 600,
                    backgroundColor: "#dcfce7", color: "#166534",
                  }}>
                    {pedido.status}
                  </span>
                </div>
              </div>

              {/* Info cliente e vendedor */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "14px 16px", borderLeft: "4px solid #071633" }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#888", marginBottom: "6px" }}>CLIENTE</div>
                  <div style={{ fontSize: "15px", fontWeight: 700 }}>{pedido.cliente_nome}</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "14px 16px", borderLeft: "4px solid #2563eb" }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#888", marginBottom: "6px" }}>VENDEDOR</div>
                  <div style={{ fontSize: "15px", fontWeight: 700 }}>{pedido.vendedor_nome}</div>
                </div>
              </div>

              {/* Tabela de itens */}
              <table style={{ width: "100%", borderCollapse: "collapse" as const, marginBottom: "20px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#071633", color: "#fff" }}>
                    {["#", "Produto", "Tamanho", "Qtd.", "Valor Unit.", "Subtotal"].map((h, i) => (
                      <th key={h} style={{
                        padding: "10px 12px", textAlign: i >= 3 ? "right" as const : "left" as const,
                        fontSize: "12px", fontWeight: 600,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pedido.itens.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", color: "#888", fontSize: "12px" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>{item.product_name}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }}>{item.size}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "right" as const }}>{item.quantity}</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "right" as const }}>
                        R$ {item.unit_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", textAlign: "right" as const, fontWeight: 700 }}>
                        R$ {(item.unit_price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totais */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                <div style={{ minWidth: "260px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e5e7eb", fontSize: "13px", color: "#555" }}>
                    <span>Total de itens</span>
                    <span>{totalItens} pares</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: "17px", fontWeight: 800, color: "#071633" }}>
                    <span>TOTAL</span>
                    <span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {pedido.observacoes && (
                <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "12px 16px", marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#92400e", marginBottom: "4px" }}>OBSERVAÇÕES</div>
                  <div style={{ fontSize: "13px", color: "#78350f" }}>{pedido.observacoes}</div>
                </div>
              )}

              {/* Assinatura */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "48px" }}>
                <div style={{ borderTop: "1px solid #aaa", paddingTop: "8px", textAlign: "center" as const, fontSize: "12px", color: "#555" }}>
                  Assinatura do Cliente<br />{pedido.cliente_nome}
                </div>
                <div style={{ borderTop: "1px solid #aaa", paddingTop: "8px", textAlign: "center" as const, fontSize: "12px", color: "#555" }}>
                  Assinatura do Vendedor<br />{pedido.vendedor_nome}
                </div>
              </div>

              {/* Rodapé */}
              <div style={{ marginTop: "32px", textAlign: "center" as const, fontSize: "11px", color: "#aaa", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
                {nomeEmpresa} · Pedido #{pedido.id} · Gerado em {new Date().toLocaleString("pt-BR")}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}