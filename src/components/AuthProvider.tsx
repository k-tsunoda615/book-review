import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { authenticateUser, getUserInfo } from "../services/api";
import type { User, AuthContextType } from "../types/auth";
import { TOKEN_KEY, USER_KEY } from "../types/auth";
import { AuthContext } from "../contexts/AuthContext";

// AuthProviderのProps
type AuthProviderProps = {
  children: ReactNode;
};

// 認証プロバイダーコンポーネント
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にローカルストレージからトークンとユーザー情報を読み込み
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          // トークンが有効かどうかを確認
          try {
            const userInfo = await getUserInfo(savedToken);
            setUser({ name: userInfo.name });
          } catch (error) {
            // トークンが無効な場合はクリア
            console.warn("トークンが無効です:", error);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("認証の初期化に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ログイン処理
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authenticateUser(email, password);
      const { token: newToken } = response;

      // ユーザー情報を取得
      const userInfo = await getUserInfo(newToken);
      const userData = { name: userInfo.name, email };

      // 状態を更新
      setToken(newToken);
      setUser(userData);

      // ローカルストレージに保存
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("ログインに失敗しました:", error);
      throw error;
    }
  };

  // ログアウト処理
  const logout = (): void => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // ユーザー情報更新処理
  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
