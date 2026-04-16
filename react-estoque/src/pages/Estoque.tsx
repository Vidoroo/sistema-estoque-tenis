import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api";

type Produto = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  tamanhos: Record<string, string>;
};

export default function Estoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [modal, setModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [tipoMovimento, setTipoMovimento] = useState<"entrada" | "saida">("entrada");

  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notaFiscal, setNotaFiscal] = useState("");

  const carregarEstoque = async () => {
    const res = await fetch(`${API_URL}/stock/`);
    const json = await res.json();
    setProdutos(json.data || []);
  };

  useEffect(() => {
    carregarEstoque();
  }, []);

  const abrirModal = (produto: Produto, tipo: "entrada" | "saida") => {
    setProdutoSelecionado(produto);
    setTipoMovimento(tipo);
    setSize("");
    setQuantity(1);
    setNotaFiscal("");
    setModal(true);
  };

  const movimentar = async () => {
    if (!produtoSelecionado || !size) {
      alert("Selecione o tamanho");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/stock/movement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: produtoSelecionado.id,
          movement_type: tipoMovimento,
          quantity,
          size,
          nota_fiscal: tipoMovimento === "entrada" ? notaFiscal : undefined,
          description:
            tipoMovimento === "entrada"
              ? "Entrada de estoque"
              : "Saída de estoque",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Erro");
      }

      setModal(false);
      carregarEstoque();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const resumoCardStyle = (borderColor: string): React.CSSProperties => ({
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    borderLeft: `4px solid ${borderColor}`,
  });

  const totalProdutos = produtos.length;
  const semEstoque = produtos.filter((p) => Number(p.quantity) === 0).length;
  const baixoEstoque = produtos.filter(
    (p) => Number(p.quantity) > 0 && Number(p.quantity) <= 5
  ).length;

  return (
    <div style={{ padding: "24px", color: "#071633" }}>
      <h1
        style={{
          fontSize: "2.2rem",
          fontWeight: 800,
          marginBottom: "8px",
        }}
      >
        Estoque
      </h1>

      <p style={{ color: "#6b7280", marginBottom: "24px" }}>
        Controle, consulta e movimentação do estoque por numeração.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={resumoCardStyle("#071633")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Total de Produtos
          </p>
          <h2 style={{ margin: "8px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {totalProdutos}
          </h2>
        </div>

        <div style={resumoCardStyle("#dc2626")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Sem Estoque
          </p>
          <h2 style={{ margin: "8px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {semEstoque}
          </h2>
        </div>

        <div style={resumoCardStyle("#f59e0b")}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
            Baixo Estoque
          </p>
          <h2 style={{ margin: "8px 0 0", fontSize: "2rem", fontWeight: 800 }}>
            {baixoEstoque}
          </h2>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Lista de Estoque</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Produto</th>
              <th style={thStyle}>Categoria</th>
              <th style={thStyle}>Quantidade</th>
              <th style={thStyle}>Tamanhos</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {produtos.map((p) => {
              const tamanhosComEstoque = Object.entries(p.tamanhos || {}).filter(
                ([_, qtd]) => Number(qtd) > 0
              );

              return (
                <tr key={p.id}>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>{p.category}</td>
                  <td style={tdStyle}>{p.quantity}</td>

                  <td style={tdStyle}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {tamanhosComEstoque.length === 0 ? (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          Sem estoque
                        </span>
                      ) : (
                        tamanhosComEstoque.map(([num, qtd]) => (
                          <span
                            key={num}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              backgroundColor: "#dcfce7",
                              color: "#166534",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {num}: {qtd}
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => abrirModal(p, "entrada")}
                        style={btnEntrada}
                      >
                        Entrada
                      </button>
                      <button
                        onClick={() => abrirModal(p, "saida")}
                        style={btnSaida}
                      >
                        Saída
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && produtoSelecionado && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ marginTop: 0 }}>
              {tipoMovimento === "entrada" ? "Entrada de Estoque" : "Saída de Estoque"}
            </h3>

            <p style={{ marginBottom: "16px", color: "#6b7280" }}>
              Produto: <strong>{produtoSelecionado.name}</strong>
            </p>

            <div style={{ display: "grid", gap: "12px" }}>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                style={inputStyle}
              >
                <option value="">Selecione o tamanho</option>
                {Object.keys(produtoSelecionado.tamanhos || {}).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={quantity}
                min={1}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="Quantidade"
                style={inputStyle}
              />

              {tipoMovimento === "entrada" && (
                <input
                  value={notaFiscal}
                  onChange={(e) => setNotaFiscal(e.target.value)}
                  placeholder="Nota Fiscal"
                  style={inputStyle}
                />
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button onClick={() => setModal(false)} style={btnCancelar}>
                  Cancelar
                </button>
                <button onClick={movimentar} style={btnConfirmar}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "2px solid #e5e7eb",
  color: "#6b7280",
  fontSize: "12px",
  textTransform: "uppercase",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #f3f4f6",
  verticalAlign: "middle",
};

const btnEntrada: React.CSSProperties = {
  backgroundColor: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 600,
};

const btnSaida: React.CSSProperties = {
  backgroundColor: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 600,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  padding: "24px",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "400px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const btnCancelar: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const btnConfirmar: React.CSSProperties = {
  backgroundColor: "#071633",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 600,
};