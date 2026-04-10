import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

type Product = {
  id: number;
  name: string;
  quantity: number;
};

type Movement = {
  id: number;
  product_id: number;
  product_name: string;
  movement_type: "entrada" | "saida";
  quantity: number;
  description?: string;
  created_at: string;
};

const API_URL = "http://127.0.0.1:5000/api";

export function Estoque() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [tipoSelecionado, setTipoSelecionado] = useState<"entrada" | "saida">("entrada");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarProdutos();
    carregarHistorico();
  }, []);

  async function carregarProdutos() {
    try {
      const response = await fetch(`${API_URL}/products/`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  }

  async function carregarHistorico() {
    try {
      const response = await fetch(`${API_URL}/stock/history`);
      const data = await response.json();

      if (data.success) {
        setMovements(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  }

  async function movimentar() {
    setErro("");

    const id = Number(produtoId);
    const qtd = Number(quantidade);
    const produto = products.find((p) => p.id === id);

    if (!produto) {
      setErro("Selecione um produto.");
      return;
    }

    if (!qtd || qtd <= 0) {
      setErro("Informe uma quantidade válida.");
      return;
    }

    if (tipoSelecionado === "saida" && produto.quantity < qtd) {
      setErro("Estoque insuficiente para realizar a saída.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/stock/movement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product_id: id,
          movement_type: tipoSelecionado,
          quantity: qtd,
          description: notaFiscal.trim()
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao movimentar estoque.");
      }

      setProdutoId("");
      setQuantidade("");
      setNotaFiscal("");

      await carregarProdutos();
      await carregarHistorico();
    } catch (error: any) {
      setErro(error.message || "Erro ao movimentar estoque.");
    }
  }

  const historicoAtual = movements.filter(
    (m) => m.movement_type === tipoSelecionado
  );

  function formatarData(data: string) {
    const date = new Date(data);
    return date.toLocaleDateString("pt-BR");
  }

  return (
    <div className="container">
      <div className="page-header estoque-header">
        <div>
          <h1>Controle de Estoque</h1>
          <p className="page-subtitle">Gerencie entradas e saídas de produtos</p>
        </div>

        <div className="stock-type-actions">
          <button
            type="button"
            className={`stock-action-btn green ${tipoSelecionado === "entrada" ? "active" : ""}`}
            onClick={() => setTipoSelecionado("entrada")}
          >
            <ArrowUpRight size={16} />
            Entrada
          </button>

          <button
            type="button"
            className={`stock-action-btn red ${tipoSelecionado === "saida" ? "active" : ""}`}
            onClick={() => setTipoSelecionado("saida")}
          >
            <ArrowDownRight size={16} />
            Saída
          </button>
        </div>
      </div>

      <div className="stock-toggle-bar">
        <button
          type="button"
          className={`stock-toggle-item ${tipoSelecionado === "entrada" ? "selected" : ""}`}
          onClick={() => setTipoSelecionado("entrada")}
        >
          <ArrowUpRight size={14} />
          Histórico de Entradas (
          {movements.filter((m) => m.movement_type === "entrada").length})
        </button>

        <button
          type="button"
          className={`stock-toggle-item ${tipoSelecionado === "saida" ? "selected" : ""}`}
          onClick={() => setTipoSelecionado("saida")}
        >
          <ArrowDownRight size={14} />
          Histórico de Saídas (
          {movements.filter((m) => m.movement_type === "saida").length})
        </button>
      </div>

      <div className="stock-form-card">
        <div className="stock-form-grid">
          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            <option value="">Selecione o produto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />

          <input
            type="text"
            placeholder="Nota Fiscal / descrição"
            value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
          />

          <button
            type="button"
            className={`button ${tipoSelecionado === "entrada" ? "green" : "red"}`}
            onClick={movimentar}
          >
            Confirmar {tipoSelecionado === "entrada" ? "Entrada" : "Saída"}
          </button>
        </div>

        {erro && <p className="erro-texto">{erro}</p>}
      </div>

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>DATA</th>
              <th>NOTA FISCAL</th>
              <th>PRODUTO</th>
              <th>QUANTIDADE</th>
            </tr>
          </thead>

          <tbody>
            {historicoAtual.length > 0 ? (
              historicoAtual.map((item) => (
                <tr key={item.id}>
                  <td>{formatarData(item.created_at)}</td>
                  <td>{item.description || "-"}</td>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="empty-state-cell">
                  {tipoSelecionado === "entrada"
                    ? 'Nenhuma entrada registrada.'
                    : 'Nenhuma saída registrada.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="alert">
          Nenhum produto cadastrado. Acesse <strong>Cadastrar Produto</strong> antes de fazer movimentações.
        </div>
      )}
    </div>
  );
}