/* import { useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useMovements } from "../hooks/useMovements";

export function Estoque() {
  const { products, setProducts } = useProducts();
  const { movements, addMovement } = useMovements();

  const [tipoSelecionado, setTipoSelecionado] = useState<"entrada" | "saida">("entrada");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [erro, setErro] = useState("");

  const entradas = movements.filter((m) => m.type === "entrada");
  const saidas = movements.filter((m) => m.type === "saida");

  function movimentar() {
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

    if (tipoSelecionado === "saida" && produto.stock < qtd) {
      setErro("Estoque insuficiente para realizar a saída.");
      return;
    }

    const atualizados = products.map((p) => {
      if (p.id !== id) return p;

      return {
        ...p,
        stock: tipoSelecionado === "entrada" ? p.stock + qtd : p.stock - qtd,
      };
    });

    setProducts(atualizados);

    addMovement({
      id: Date.now(),
      type: tipoSelecionado,
      date: new Date().toLocaleDateString("pt-BR"),
      notaFiscal: notaFiscal.trim(),
      productName: produto.name,
      quantity: qtd,
    });

    setProdutoId("");
    setQuantidade("");
    setNotaFiscal("");
  }

  const historicoAtual = tipoSelecionado === "entrada" ? entradas : saidas;

  return (
    <div className="container">
      <div className="page-header estoque-header">
        <div>
          <h1>Controle de Estoque</h1>
          <p className="page-subtitle">Gerencie entradas e saídas de produtos</p>
        </div>

        <div className="stock-type-actions">
          <button
            className={`stock-action-btn green ${tipoSelecionado === "entrada" ? "active" : ""}`}
            onClick={() => setTipoSelecionado("entrada")}
          >
            <ArrowUpRight size={16} />
            Entrada
          </button>

          <button
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
          className={`stock-toggle-item ${tipoSelecionado === "entrada" ? "selected" : ""}`}
          onClick={() => setTipoSelecionado("entrada")}
        >
          <ArrowUpRight size={14} />
          Histórico de Entradas ({entradas.length})
        </button>

        <button
          className={`stock-toggle-item ${tipoSelecionado === "saida" ? "selected" : ""}`}
          onClick={() => setTipoSelecionado("saida")}
        >
          <ArrowDownRight size={14} />
          Histórico de Saídas ({saidas.length})
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
            placeholder="Nota Fiscal (opcional)"
            value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
          />

          <button
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
                  <td>{item.date}</td>
                  <td>{item.notaFiscal || "-"}</td>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="empty-state-cell">
                  {tipoSelecionado === "entrada"
                    ? 'Nenhuma entrada registrada. Clique em "Entrada" para adicionar.'
                    : 'Nenhuma saída registrada. Clique em "Saída" para adicionar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="alert">
          Nenhum produto cadastrado. Acesse a página de <strong>Lista de Produtos</strong> para
          adicionar produtos antes de fazer movimentações de estoque.
        </div>
      )}
    </div>
  );
} */

import { useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useMovements } from "../hooks/useMovements";

export function Estoque() {
  const { products = [], setProducts } = useProducts();
  const { movements = [], addMovement } = useMovements();

  const [tipoSelecionado, setTipoSelecionado] = useState<"entrada" | "saida">("entrada");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [erro, setErro] = useState("");

  const entradas = movements.filter((m) => m.type === "entrada");
  const saidas = movements.filter((m) => m.type === "saida");

  function movimentar() {
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

    if (tipoSelecionado === "saida" && produto.stock < qtd) {
      setErro("Estoque insuficiente para realizar a saída.");
      return;
    }

    const atualizados = products.map((p) => {
      if (p.id !== id) return p;

      return {
        ...p,
        stock: tipoSelecionado === "entrada" ? p.stock + qtd : p.stock - qtd,
      };
    });

    setProducts(atualizados);

    addMovement({
      id: Date.now(),
      type: tipoSelecionado,
      date: new Date().toLocaleDateString("pt-BR"),
      notaFiscal: notaFiscal.trim(),
      productName: produto.name,
      quantity: qtd,
    });

    setProdutoId("");
    setQuantidade("");
    setNotaFiscal("");
  }

  const historicoAtual = tipoSelecionado === "entrada" ? entradas : saidas;

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
          Histórico de Entradas ({entradas.length})
        </button>

        <button
          type="button"
          className={`stock-toggle-item ${tipoSelecionado === "saida" ? "selected" : ""}`}
          onClick={() => setTipoSelecionado("saida")}
        >
          <ArrowDownRight size={14} />
          Histórico de Saídas ({saidas.length})
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
            placeholder="Nota Fiscal (opcional)"
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
                  <td>{item.date}</td>
                  <td>{item.notaFiscal || "-"}</td>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="empty-state-cell">
                  {tipoSelecionado === "entrada"
                    ? 'Nenhuma entrada registrada. Clique em "Entrada" para adicionar.'
                    : 'Nenhuma saída registrada. Clique em "Saída" para adicionar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="alert">
          Nenhum produto cadastrado. Acesse a página de <strong>Lista de Produtos</strong> para adicionar produtos antes de fazer movimentações de estoque.
        </div>
      )}
    </div>
  );
}