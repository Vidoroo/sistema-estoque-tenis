import { useState } from 'react';
import { useLocalStorage } from '../hooks/useProducts.ts';

export function Produtos() {
  const [produtos, setProdutos] = useLocalStorage<any[]>("produtos", []);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');

  function adicionar() {
    const novo = {
      id: Date.now(),
      nome,
      preco: Number(preco),
      estoque: 0
    };

    setProdutos([...produtos, novo]);
    setNome('');
    setPreco('');
  }

  function remover(id: number) {
    setProdutos(produtos.filter(p => p.id !== id));
  }

  return (
    <div>
      <h2>Produtos</h2>

      <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" />
      <input value={preco} onChange={e => setPreco(e.target.value)} placeholder="Preço" />

      <button onClick={adicionar}>Adicionar</button>

      <ul>
        {produtos.map(p => (
          <li key={p.id}>
            {p.nome} - R$ {p.preco} - Estoque: {p.estoque}
            <button onClick={() => remover(p.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}