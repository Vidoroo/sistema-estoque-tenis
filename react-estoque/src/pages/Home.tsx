import { useProducts } from "../hooks/useProducts";

export function Home() {
  const { products } = useProducts();

  const totalProdutos = products?.length || 0;

  const totalEstoque =
    products?.reduce((acc, p) => acc + p.stock, 0) || 0;

  const valorTotal =
    products?.reduce((acc, p) => acc + p.price * p.stock, 0) || 0;

  return (
    <div className="container">
      <h1>Dashboard</h1>

      <div className="cards">
        <div className="card">
          <span className="card-title">Total de Produtos</span>
          <div className="card-value">{totalProdutos}</div>
        </div>

        <div className="card">
          <span className="card-title">Total em Estoque</span>
          <div className="card-value">{totalEstoque}</div>
        </div>

        <div className="card">
          <span className="card-title">Valor Total</span>
          <div className="card-value">
            R$ {valorTotal.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}