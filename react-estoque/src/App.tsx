import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Produtos } from "./pages/Produtos";
import { Estoque } from "./pages/Estoque";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import CadastroProduto from "./pages/CadastroProduto";
import { PrivateRoute } from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <Home />
              </>
            </PrivateRoute>
          }
        />

        <Route
          path="/produtos"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <Produtos />
              </>
            </PrivateRoute>
          }
        />

        <Route
          path="/estoque"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <Estoque />
              </>
            </PrivateRoute>
          }
        />

        <Route
          path="/cadastro-produto"
          element={
            <PrivateRoute>
              <>
                <Navbar />
                <CadastroProduto />
              </>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;