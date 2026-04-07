import { Link, useNavigate } from "react-router-dom";
import { logoutUser, getCurrentUser } from "../services/auth";

export function Navbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    const confirmar = window.confirm("Deseja sair do sistema?");
    if (!confirmar) return;

    logoutUser();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>React Estoque</h2>

        <Link to="/">Home</Link>
        <Link to="/produtos">Produtos</Link>
        <Link to="/estoque">Estoque</Link>
        <Link to="/cadastro-produto">Cadastrar Produto</Link>
      </div>

      <div className="navbar-right">
        <span className="user-name">
          👤 {user || "Usuário"}
        </span>

        <button className="logout-button" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </nav>
  );
}