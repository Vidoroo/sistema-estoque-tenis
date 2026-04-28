import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/auth";

export default function Register() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [erro, setErro] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  async function handleRegister() {
    setErro("");

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      await registerUser(username.trim(), password);

      alert("Cadastro realizado com sucesso.");
      navigate("/login");
    } catch (error: any) {
      setErro(error.message || "Erro ao cadastrar usuário.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Cadastrar Usuário</h2>

        <input
          type="email"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        <div className="password-hint">
          A senha deve ter pelo menos 8 caracteres, com letra maiúscula,
          minúscula, número e caractere especial.
        </div>

        {erro && <p className="erro-texto">{erro}</p>}

        <button onClick={handleRegister} disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>

        <p className="auth-link-text">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}