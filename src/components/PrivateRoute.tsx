import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../services/auth";

export default function PrivateRoute() {
  const autenticado = isAuthenticated();

  return autenticado ? <Outlet /> : <Navigate to="/login" replace />;
}