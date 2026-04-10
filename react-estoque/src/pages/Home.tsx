import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
};

const API_URL = "http://127.0.0.1:5000/api";

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      const response = await fetch(`${API_URL}/products/`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  }

  const totalProdutos = products.length;
  const totalEstoque = products.reduce((acc, p) => acc + p.quantity, 0);
  const valorTotal = products.reduce((acc, p) => acc + p.price * p.quantity, 0);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">
            Visão geral do estoque e dos produtos cadastrados
          </p>
        </div>
      </div>

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
          <div className="card-value">R$ {valorTotal.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}