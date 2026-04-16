import { API_URL } from "./api";

export interface Cliente {
  id?: number;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  observacoes?: string;
}

export const listarClientes = async (): Promise<Cliente[]> => {
  const response = await fetch(`${API_URL}/clientes`);
  return response.json();
};

export const criarCliente = async (cliente: Cliente) => {
  const response = await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cliente),
  });

  return response.json();
};

export const atualizarCliente = async (id: number, cliente: Cliente) => {
  const response = await fetch(`${API_URL}/clientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cliente),
  });

  return response.json();
};

export const excluirCliente = async (id: number) => {
  const response = await fetch(`${API_URL}/clientes/${id}`, {
    method: "DELETE",
  });

  return response.json();
};