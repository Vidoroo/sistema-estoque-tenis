import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api";

type Produto = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

type Venda = {
  id: number;
  valor_total: number;
  valor_comissao: number;
  created_at: string;
};

type Cliente = {
  id: number;
};

type Vendedor = {
  id: number;
};

export default function Home() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  const carregarDashboard = async () => {
    const [resProdutos, resVendas, resClientes, resVendedores] = await Promise.all([
      fetch(`${API_URL}/products/`),
      fetch(`${API_URL}/vendas/`),
      fetch(`${API_URL}/clientes`),
      fetch(`${API_URL}/vendedores/`),
    ]);

    const jsonProdutos = await resProdutos.json();
    const jsonVendas = await resVendas.json();
    const jsonClientes = await resClientes.json();
    const jsonVendedores = await resVendedores.json();

    setProdutos(jsonProdutos.data || []);
    setVendas(jsonVendas.data || []);
    setClientes(Array.isArray(jsonClientes) ? jsonClientes : jsonClientes.data || []);
    setVendedores(jsonVendedores.data || []);
  };

  useEffect(() => {
    carregarDashboard();
  }, []);

  const valorTotalEstoque = produtos.reduce(
    (acc, p) => acc + Number(p.quantity || 0) * Number(p.price || 0),
    0
  );

  const produtosSemEstoque = produtos.filter((p) => Number(p.quantity) === 0).length;

  const produtosBaixoEstoque = produtos.filter(
    (p) => Number(p.quantity) > 0 && Number(p.quantity) <= 5
  ).length;

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const vendasMes = vendas.filter((v) => {
    const d = new Date(v.created_at);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const totalVendasMes = vendasMes.reduce(
    (acc, v) => acc + Number(v.valor_total || 0),
    0
  );

  const totalComissaoMes = vendasMes.reduce(
    (acc, v) => acc + Number(v.valor_comissao || 0),
    0
  );

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  };

  return (
    <div>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "8px", color: "#071633" }}>
        Dashboard
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>
        Visão geral do estoque, vendas e comissão.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
        }}
      >
        <div style={cardStyle}>
          <h3>Total de Produtos</h3>
          <h2>{produtos.length}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Valor Total em Estoque</h3>
          <h2>R$ {valorTotalEstoque.toFixed(2)}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Produtos Sem Estoque</h3>
          <h2>{produtosSemEstoque}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Baixo Estoque</h3>
          <h2>{produtosBaixoEstoque}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Total de Clientes</h3>
          <h2>{clientes.length}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Total de Vendedores</h3>
          <h2>{vendedores.length}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Vendas do Mês</h3>
          <h2>R$ {totalVendasMes.toFixed(2)}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Comissão do Mês</h3>
          <h2>R$ {totalComissaoMes.toFixed(2)}</h2>
        </div>
      </div>
    </div>
  );
}