import { useLocalStorage } from '../hooks/useProducts.ts';

export function Home() {
  const [produtos] = useLocalStorage<any[]>("produtos", []);
  const [historico] = useLocalStorage<any[]>("historico", []);

  const totalProdutos = produtos.length;
  const totalEstoque = produtos.reduce((acc, p) => acc + p.estoque, 0);
  const valorTotal = produtos.reduce((acc, p) => acc + p.preco * p.estoque, 0);

  return (
  <div className="card">
    <h1>Dashboard</h1>

    <p>Total Produtos: {totalProdutos}</p>
    <p>Total Estoque: {totalEstoque}</p>
    <p>Valor Total: R$ {valorTotal.toFixed(2)}</p>
    <p>Movimentações: {historico.length}</p>
  </div>
);
}

