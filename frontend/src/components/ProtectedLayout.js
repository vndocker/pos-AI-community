import { Outlet } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedLayout = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/signin" />;
    }

    return (
        <div>
            {/* Có thể thêm navigation bar hoặc sidebar chung ở đây */}
            <Outlet />
        </div>
    );
};

export default ProtectedLayout; 