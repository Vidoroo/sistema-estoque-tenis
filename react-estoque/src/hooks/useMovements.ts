import { useLocalStorage } from "./useLocalStorage.ts";

export type Movement = {
  id: number;
  type: "entrada" | "saida";
  date: string;
  notaFiscal: string;
  productName: string;
  quantity: number;
};

export function useMovements() {
  const [movements, setMovements] = useLocalStorage<Movement[]>("movements", []);

  function addMovement(movement: Movement) {
    setMovements([movement, ...(Array.isArray(movements) ? movements : [])]);
  }

  return {
    movements: Array.isArray(movements) ? movements : [],
    addMovement,
    setMovements,
  };
}