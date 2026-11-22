import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { state } = useApp();

    if (!state.user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(state.user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
