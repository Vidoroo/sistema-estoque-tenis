export const API_URL = "http://127.0.0.1:5000/api";

export type ProdutoPayload = {
  codigo?: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  image?: string;

  preco_atacado?: number;
  preco_dropshipping?: number;
  preco_varejo?: number;

  nota_fiscal?: string;
  serie_nf?: string;
  data_emissao?: string;
  fornecedor?: string;
  chave_acesso?: string;
  observacoes_nf?: string;

  tamanhos?: Record<string, string>;
};

async function tratarResposta(response: Response) {
  const texto = await response.text();

  let json: any = null;

  if (texto) {
    try {
      json = JSON.parse(texto);
    } catch {
      throw new Error(texto);
    }
  }

  if (!response.ok) {
    throw new Error(
      json?.message ||
      json?.erro ||
      `Erro HTTP ${response.status}`
    );
  }

  return json;
}

export async function listarProdutos() {
  const response = await fetch(`${API_URL}/products/`);
  const json = await tratarResposta(response);
  return json?.data ?? [];
}

export async function criarProduto(produto: ProdutoPayload) {
  const response = await fetch(`${API_URL}/products/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(produto),
  });

  return tratarResposta(response);
}

export async function editarProduto(id: number, produto: ProdutoPayload) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(produto),
  });

  return tratarResposta(response);
}

export async function excluirProduto(id: number) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });

  return tratarResposta(response);
}