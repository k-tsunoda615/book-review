import { createContext } from "react";
import type { AuthContextType } from "../types/auth";

// 認証コンテキストを作成
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
