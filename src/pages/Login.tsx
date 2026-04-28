import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getLockInfo, loginUser } from "../services/auth";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      const lockInfo = getLockInfo();
      setRemainingSeconds(lockInfo.remainingSeconds);
    }, 1000);

    const initialLock = getLockInfo();
    setRemainingSeconds(initialLock.remainingSeconds);

    return () => clearInterval(interval);
  }, []);

  async function handleLogin() {
    setErro("");

    if (!usuario.trim() || !senha.trim()) {
      setErro("Preencha usuário e senha.");
      return;
    }

    try {
      await loginUser(usuario.trim(), senha);
      navigate("/");
    } catch (error: any) {
      setErro(error.message || "Erro ao fazer login.");
      const lockInfo = getLockInfo();
      setRemainingSeconds(lockInfo.remainingSeconds);
    }
  }

  const bloqueado = remainingSeconds > 0;

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        <input
          type="text"
          placeholder="Usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          disabled={bloqueado}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={bloqueado}
        />

        {erro && <p className="erro-texto">{erro}</p>}

        {bloqueado && (
          <p className="lock-text">
            Login bloqueado. Tente novamente em {remainingSeconds}s.
          </p>
        )}

        <button onClick={handleLogin} disabled={bloqueado}>
          Entrar
        </button>

        <p className="auth-link-text">
          Não tem conta? <Link to="/register">Cadastrar</Link>
        </p>
      </div>
    </div>
  );
}