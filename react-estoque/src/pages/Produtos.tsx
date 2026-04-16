import { useEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";

type Product = {
  id: number;
  ncm: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  image: string;
};

const API_URL = "http://127.0.0.1:5000/api";

export default function Produtos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [produtoEditando, setProdutoEditando] = useState<Product | null>(null);

  const [formNcm, setFormNcm] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formImage, setFormImage] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/products/`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao buscar produtos.");
      }

      const produtosFormatados: Product[] = (data.data || []).map((produto: any) => ({
        id: produto.id,
        ncm: produto.category || "",
        name: produto.name || "",
        category: produto.category || "",
        quantity: produto.quantity ?? 0,
        price: Number(produto.price) || 0,
        image: produto.image || "https://via.placeholder.com/56?text=IMG",
      }));

      setProducts(produtosFormatados);
    } catch (error: any) {
      alert(error.message || "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(id: number) {
    const confirmar = window.confirm("Deseja excluir este produto?");
    if (!confirmar) return;

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao excluir produto.");
      }

      setProducts((produtosAtuais) => produtosAtuais.filter((p) => p.id !== id));
    } catch (error: any) {
      alert(error.message || "Erro ao excluir produto.");
    }
  }

  function abrirEdicao(produto: Product) {
    setProdutoEditando(produto);
    setFormNcm(produto.ncm);
    setFormName(produto.name);
    setFormPrice(String(produto.price));
    setFormStock(String(produto.quantity));
    setFormImage(produto.image);
  }

  function fecharEdicao() {
    setProdutoEditando(null);
    setFormNcm("");
    setFormName("");
    setFormPrice("");
    setFormStock("");
    setFormImage("");
  }

  async function salvarEdicao() {
    if (!produtoEditando) return;

    if (!formNcm.trim() || !formName.trim() || !formPrice || !formStock) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const preco = Number(formPrice);
    const estoque = Number(formStock);

    if (Number.isNaN(preco) || preco < 0) {
      alert("Informe um preço válido.");
      return;
    }

    if (Number.isNaN(estoque) || estoque < 0) {
      alert("Informe um estoque válido.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/products/${produtoEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formName.trim(),
          category: formNcm.trim(),
          quantity: estoque,
          price: preco,
          image: formImage.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erro ao editar produto.");
      }

      setProducts((produtosAtuais) =>
        produtosAtuais.map((p) =>
          p.id === produtoEditando.id
            ? {
                ...p,
                ncm: formNcm.trim(),
                category: formNcm.trim(),
                name: formName.trim(),
                quantity: estoque,
                price: preco,
                image: formImage.trim() || p.image,
              }
            : p
        )
      );

      fecharEdicao();
    } catch (error: any) {
      alert(error.message || "Erro ao editar produto.");
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Lista de Produtos</h1>
          <p className="page-subtitle">Gerencie o catálogo de tênis</p>
        </div>
      </div>

      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>NCM</th>
                <th>Produto</th>
                <th>Preço</th>
                <th>Imagem</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-cell">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.ncm}</td>
                    <td>{p.name}</td>
                    <td>R$ {p.price.toFixed(2)}</td>

                    <td>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="product-img"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/56?text=IMG";
                        }}
                      />
                    </td>

                    <td>
                      <span className={`badge ${p.quantity < 10 ? "yellow" : "green"}`}>
                        {p.quantity} unidades
                      </span>
                    </td>

                    <td>
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="icon-action edit"
                          onClick={() => abrirEdicao(p)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="icon-action delete"
                          onClick={() => excluirProduto(p.id)}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {produtoEditando && (
        <div className="modal-overlay" onClick={fecharEdicao}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Produto</h2>
              <button className="modal-close" onClick={fecharEdicao}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <label>NCM</label>
              <input
                value={formNcm}
                onChange={(e) => setFormNcm(e.target.value)}
              />

              <label>Nome do Produto</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />

              <label>Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />

              <label>Estoque Inicial</label>
              <input
                type="number"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
              />

              <label>URL da imagem</label>
              <input
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="https://site.com/imagem.jpg"
              />
            </div>

            <div className="modal-footer">
              <button className="button secondary" onClick={fecharEdicao}>
                Cancelar
              </button>
              <button className="button blue" onClick={salvarEdicao}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}