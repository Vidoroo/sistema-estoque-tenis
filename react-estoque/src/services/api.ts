const API_URL = "http://127.0.0.1:5000/api";

export type ProdutoPayload = {
  name: string;
  category: string;
  quantity: number;
  price: number;
  image?: string;
};

export async function listarProdutos() {
  const response = await fetch(`${API_URL}/products/`);
  return response.json();
}

export async function criarProduto(produto: ProdutoPayload) {
  const response = await fetch(`${API_URL}/products/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(produto),
  });

  return response.json();
}

export async function editarProduto(id: number, produto: ProdutoPayload) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(produto),
  });

  return response.json();
}

export async function excluirProduto(id: number) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });

  return response.json();
}