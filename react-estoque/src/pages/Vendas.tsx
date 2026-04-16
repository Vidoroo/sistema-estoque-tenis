import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api";

type Cliente = {
  id: number;
  nome: string;
};

type Vendedor = {
  id: number;
  nome: string;
  percentual_comissao?: number;
};

type Produto = {
  id: number;
  name: string;
  price: number;
  tamanhos: Record<string, string>;
};

type ItemVenda = {
  product_id: number;
  size: string;
  quantity: number;
};

type Venda = {
  id: number;
  cliente_nome: string;
  vendedor_nome: string;
  valor_total: number;
  percentual_comissao: number;
  valor_comissao: number;
  created_at: string;
};

export default function Vendas() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const carregarTudo = async () => {
    const [resClientes, resVendedores, resProdutos, resVendas] = await Promise.all([
      fetch(`${API_URL}/clientes`),
      fetch(`${API_URL}/vendedores/`),
      fetch(`${API_URL}/stock/`),
      fetch(`${API_URL}/vendas/`),
    ]);

    const jsonClientes = await resClientes.json();
    const jsonVendedores = await resVendedores.json();
    const jsonProdutos = await resProdutos.json();
    const jsonVendas = await resVendas.json();

    setClientes(Array.isArray(jsonClientes) ? jsonClientes : jsonClientes.data || []);
    setVendedores(jsonVendedores.data || []);
    setProdutos(jsonProdutos.data || []);
    setVendas(jsonVendas.data || []);
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const produtoSelecionado = produtos.find((p) => String(p.id) === produtoId);

  const adicionarItem = () => {
    if (!produtoId || !size || quantity <= 0) {
      alert("Selecione produto, tamanho e quantidade.");
      return;
    }

    setItens((prev) => [
      ...prev,
      {
        product_id: Number(produtoId),
        size,
        quantity,
      },
    ]);

    setProdutoId("");
    setSize("");
    setQuantity(1);
  };

  const removerItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  };

  const salvarVenda = async () => {
    if (!clienteId) {
      alert("Selecione o cliente.");
      return;
    }

    if (!vendedorId) {
      alert("Selecione o vendedor.");
      return;
    }

    if (itens.length === 0) {
      alert("Adicione pelo menos um item.");
      return;
    }

    const res = await fetch(`${API_URL}/vendas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cliente_id: Number(clienteId),
        vendedor_id: Number(vendedorId),
        observacoes,
        itens,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.message || "Erro ao salvar venda.");
      return;
    }

    alert("Venda registrada com sucesso.");

    setClienteId("");
    setVendedorId("");
    setProdutoId("");
    setSize("");
    setQuantity(1);
    setItens([]);
    setObservacoes("");

    carregarTudo();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Vendas</h1>

      <div style={{ marginBottom: "20px" }}>
        <h3>Nova Venda</h3>

        <div style={{ display: "grid", gap: "10px", maxWidth: "500px" }}>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione o cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
            <option value="">Selecione o vendedor</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>

          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            <option value="">Selecione o produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="">Selecione o tamanho</option>
            {produtoSelecionado &&
              Object.entries(produtoSelecionado.tamanhos || {}).map(([tam, qtd]) => (
                <option key={tam} value={tam}>
                  {tam} ({qtd})
                </option>
              ))}
          </select>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="Quantidade"
          />

          <button onClick={adicionarItem}>Adicionar Item</button>

          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações"
          />
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Itens da venda</h4>
          {itens.length === 0 ? (
            <p>Nenhum item adicionado.</p>
          ) : (
            <ul>
              {itens.map((item, index) => {
                const produto = produtos.find((p) => p.id === item.product_id);
                return (
                  <li key={index}>
                    {produto?.name} - Tam. {item.size} - Qtd. {item.quantity}{" "}
                    <button onClick={() => removerItem(index)}>Remover</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button onClick={salvarVenda} style={{ marginTop: "10px" }}>
          Finalizar Venda
        </button>
      </div>

      <hr />

      <h3>Histórico de Vendas</h3>

      <table style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Total</th>
            <th>% Comissão</th>
            <th>Comissão</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {vendas.map((v) => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.cliente_nome}</td>
              <td>{v.vendedor_nome}</td>
              <td>R$ {Number(v.valor_total).toFixed(2)}</td>
              <td>{Number(v.percentual_comissao).toFixed(2)}%</td>
              <td>R$ {Number(v.valor_comissao).toFixed(2)}</td>
              <td>{new Date(v.created_at).toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}