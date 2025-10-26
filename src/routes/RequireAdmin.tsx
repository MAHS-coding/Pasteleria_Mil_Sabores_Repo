import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdminEmail } from "../utils/roles";

type Props = { children: React.ReactNode; redirectTo?: string };

const RequireAdmin: React.FC<Props> = ({ children, redirectTo = "/" }) => {
  const { user } = useAuth();
  const email = user?.email || "";
  if (!isAdminEmail(email)) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
};

export default RequireAdmin;
