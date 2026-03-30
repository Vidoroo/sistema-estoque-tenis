import { Home, Package, Boxes, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../services/auth";

export function Navbar() {
  const location = useLocation();
  const usuario = getCurrentUser();

  function logout() {
    logoutUser();
    window.location.href = "/login";
  }

  return (
    <div className="navbar">
      <div className="nav-content">
        <div className="logo">📦 Sistema de Tênis</div>

        <div className="menu">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            <Home size={16} /> Home
          </Link>

          <Link
            to="/produtos"
            className={location.pathname === "/produtos" ? "active" : ""}
          >
            <Package size={16} /> Lista de Produtos
          </Link>

          <Link
            to="/estoque"
            className={location.pathname === "/estoque" ? "active" : ""}
          >
            <Boxes size={16} /> Estoque
          </Link>

          <div className="user-area">
            <span className="user-badge">{usuario}</span>

            <button className="logout-btn" onClick={logout}>
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}