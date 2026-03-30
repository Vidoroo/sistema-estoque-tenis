import { useLocalStorage } from "./useLocalStorage.ts";

import nikeAirMax90 from "../assets/nike-air-max-90.jpg";
import adidasUltraboost from "../assets/adidas-ultraboost.jpg";
import pumaRsx from "../assets/puma-rsx.jpg";
import newBalance574 from "../assets/new-balance-574.jpg";

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  ncm: string;
  image: string;
}

const produtosIniciais: Product[] = [
  {
    id: 1,
    name: "Nike Air Max 90",
    price: 799.9,
    stock: 15,
    ncm: "6403.99.10",
    image: nikeAirMax90,
  },
  {
    id: 2,
    name: "Adidas Ultraboost",
    price: 999.9,
    stock: 8,
    ncm: "6402.19.00",
    image: adidasUltraboost,
  },
  {
    id: 3,
    name: "Puma RS-X",
    price: 599.9,
    stock: 20,
    ncm: "6402.19.00",
    image: pumaRsx,
  },
  {
    id: 4,
    name: "New Balance 574",
    price: 699.9,
    stock: 12,
    ncm: "6403.99.10",
    image: newBalance574,
  },
];

export function useProducts() {
  const [products, setProducts] = useLocalStorage<Product[]>(
    "products",
    produtosIniciais
  );

  return { products, setProducts };
}