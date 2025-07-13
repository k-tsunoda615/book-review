import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 認証状態の読み込み中は何も表示しない
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-5 text-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // 未認証の場合はログイン画面にリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 認証済みの場合はコンテンツを表示
  return <>{children}</>;
};

export default ProtectedRoute;
