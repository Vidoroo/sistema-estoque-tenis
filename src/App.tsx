import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

import Home           from "./pages/Home";
import Produtos       from "./pages/Produtos";
import Estoque        from "./pages/Estoque";
import CadastroProduto from "./pages/CadastroProduto";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Clientes       from "./pages/Clientes";
import Vendedores     from "./pages/Vendedores";
import Pedidos        from "./pages/Pedidos";
import Vendas         from "./pages/Vendas";
import Comissoes      from "./pages/Comissoes";
import Metas          from "./pages/Metas";
import Devolucoes     from "./pages/Devolucoes";
import FluxoCaixa     from "./pages/FluxoCaixa";

// Portal do vendedor (rotas públicas com token)
import VendedorLogin  from "./pages/VendedorLogin";
import VendedorPortal from "./pages/VendedorPortal";

function App() {
  return (
    <Routes>
      {/* Rotas públicas do sistema */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Portal do vendedor — acesso por link único */}
      <Route path="/vendedor/:token"        element={<VendedorLogin />} />
      <Route path="/vendedor/:token/portal" element={<VendedorPortal />} />

      {/* Rotas privadas do admin */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/"                  element={<Home />} />
          <Route path="/produtos"          element={<Produtos />} />
          <Route path="/cadastro-produto"  element={<CadastroProduto />} />
          <Route path="/estoque"           element={<Estoque />} />
          <Route path="/clientes"          element={<Clientes />} />
          <Route path="/vendedores"        element={<Vendedores />} />
          <Route path="/pedidos"           element={<Pedidos />} />
          <Route path="/vendas"            element={<Vendas />} />
          <Route path="/comissoes"         element={<Comissoes />} />
          <Route path="/metas"             element={<Metas />} />
          <Route path="/devolucoes"        element={<Devolucoes />} />
          <Route path="/fluxo-caixa"       element={<FluxoCaixa />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;