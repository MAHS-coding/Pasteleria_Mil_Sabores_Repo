import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
    children: React.ReactNode;
    redirectTo?: string;
};

const ProtectedRoute: React.FC<Props> = ({ children, redirectTo = "/" }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to={redirectTo} replace />;
    return <>{children}</>;
};

export default ProtectedRoute;
