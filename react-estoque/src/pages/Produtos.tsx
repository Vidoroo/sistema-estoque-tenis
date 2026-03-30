import { useState } from "react";
import { useProducts, type Product } from "../hooks/useProducts";
import { Pencil, Trash2, X } from "lucide-react";

export function Produtos() {
  const { products, setProducts } = useProducts();

  const [produtoEditando, setProdutoEditando] = useState<Product | null>(null);
  const [formNcm, setFormNcm] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formImage, setFormImage] = useState("");

  function excluirProduto(id: number) {
    const confirmar = window.confirm("Deseja excluir este produto?");
    if (!confirmar) return;

    const novosProdutos = products.filter((p) => p.id !== id);
    setProducts(novosProdutos);
  }

  function abrirEdicao(produto: Product) {
    setProdutoEditando(produto);
    setFormNcm(produto.ncm);
    setFormName(produto.name);
    setFormPrice(String(produto.price));
    setFormStock(String(produto.stock));
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

  function salvarEdicao() {
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

    const produtosAtualizados = products.map((p) =>
      p.id === produtoEditando.id
        ? {
            ...p,
            ncm: formNcm.trim(),
            name: formName.trim(),
            price: preco,
            stock: estoque,
            image: formImage.trim() || p.image,
          }
        : p
    );

    setProducts(produtosAtualizados);
    fecharEdicao();
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Lista de Produtos</h1>
          <p className="page-subtitle">Gerencie o catálogo de tênis</p>
        </div>
      </div>

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
          {products.map((p) => (
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
                    e.currentTarget.src = "https://via.placeholder.com/56?text=%F0%9F%91%9F";
                  }}
                />
              </td>

              <td>
                <span className={`badge ${p.stock < 10 ? "yellow" : "green"}`}>
                  {p.stock} unidades
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
          ))}
        </tbody>
      </table>

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

              <label>Imagem</label>
              <input
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="../assets/adidas-ultraboost.jpg ou URL"
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