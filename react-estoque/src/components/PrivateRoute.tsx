import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/auth";

type Props = {
  children: React.ReactNode;
};

export function PrivateRoute({ children }: Props) {
  const autenticado = isAuthenticated();

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}