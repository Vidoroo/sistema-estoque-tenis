import { Link, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function Layout() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDark(saved);
    document.body.classList.toggle("dark", saved);
  }, []);

  function toggleDark() {
    const novo = !dark;
    setDark(novo);
    document.body.classList.toggle("dark", novo);
    localStorage.setItem("darkMode", String(novo));
  }

  return (
    <div>
      <nav>
        <button onClick={toggleDark}>🌙</button>

        <div style={{ display: 'flex', gap: 15 }}>
          <Link to="/">Home</Link>
          <Link to="/produtos">Produtos</Link>
          <Link to="/estoque">Estoque</Link>
        </div>
      </nav>

      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}