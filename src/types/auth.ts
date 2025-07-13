// ユーザー情報の型定義
export type User = {
  name: string;
  email?: string;
};

// 認証コンテキストの型定義
export type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
};

// ローカルストレージのキー
export const TOKEN_KEY = "auth_token";
export const USER_KEY = "auth_user";
