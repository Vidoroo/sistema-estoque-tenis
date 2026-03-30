import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../services/auth";

type Props = {
  children: React.ReactNode;
};

export function PrivateRoute({ children }: Props) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
}