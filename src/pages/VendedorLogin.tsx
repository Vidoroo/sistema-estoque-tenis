import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://127.0.0.1:5000/api";

export default function VendedorLogin() {
  const { token }  = useParams<{ token: string }>();
  const navigate   = useNavigate();
  const [senha, setSenha]       = useState("");
  const [erro, setErro]         = useState("");
  const [loading, setLoading]   = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha.trim()) { setErro("Digite a senha."); return; }
    setLoading(true);
    setErro("");
    try {
      const res  = await fetch(`${API_URL}/vendedor-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.message || "Erro ao fazer login."); return; }

      localStorage.setItem("vendedor_token",  json.data.token);
      localStorage.setItem("vendedor_id",     String(json.data.vendedor_id));
      localStorage.setItem("vendedor_nome",   json.data.vendedor_nome);

      navigate(`/vendedor/${token}/portal`);
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "#f0f4ff", fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        backgroundColor: "#fff", borderRadius: "16px", padding: "48px 40px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.12)", width: "100%", maxWidth: "400px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "64px", height: "64px", backgroundColor: "#071633",
            borderRadius: "16px", display: "inline-flex", alignItems: "center",
            justifyContent: "center", fontSize: "28px", marginBottom: "16px",
          }}>
            👟
          </div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#071633" }}>
            Portal do Vendedor
          </h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
            Entre com sua senha para acessar
          </p>
        </div>

        <form onSubmit={login}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              autoFocus
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "10px",
                border: erro ? "1.5px solid #dc2626" : "1.5px solid #d1d5db",
                fontSize: "15px", outline: "none", boxSizing: "border-box",
              }}
            />
            {erro && <p style={{ margin: "6px 0 0", color: "#dc2626", fontSize: "13px" }}>{erro}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px", backgroundColor: "#071633", color: "#fff",
              border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}