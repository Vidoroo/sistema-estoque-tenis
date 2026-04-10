import { useState } from "react";
import { criarProduto } from "../services/api";

function CadastroProduto() {
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [mensagem, setMensagem] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    if (!name || !category || !quantity || !price) {
      setMensagem("Preencha todos os campos obrigatórios.");
      return;
    }

    if (Number(quantity) < 0 || Number(price) < 0) {
      setMensagem("Quantidade e preço devem ser positivos.");
      return;
    }

    try {
      setLoading(true);

      const resposta = await criarProduto({
        name,
        category,
        quantity: Number(quantity),
        price: Number(price),
        image,
      });

      if (resposta.success) {
        setMensagem("Produto cadastrado com sucesso!");
        setName("");
        setCategory("");
        setQuantity("");
        setPrice("");
        setImage("");
      } else {
        setMensagem(resposta.message || "Erro ao cadastrar produto.");
      }
    } catch (erro: any) {
      console.error(erro);
      setMensagem("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Cadastrar Produto</h1>

      <form onSubmit={handleSubmit} className="form">
        <div>
          <label>Nome:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label>Categoria:</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label>Quantidade:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label>Preço:</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label>URL da imagem:</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            disabled={loading}
            placeholder="https://site.com/imagem.jpg"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>

      {mensagem && <p>{mensagem}</p>}
    </div>
  );
}

export default CadastroProduto;