// === 共通エラー型 ===
export type ApiError = {
  ErrorCode: number;
  ErrorMessageJP: string;
  ErrorMessageEN: string;
};

// === ユーザー関連型 ===
export type UserCreateRequest = {
  name: string;
  email: string;
  password: string;
};

export type UserCreateResponse = {
  token: string;
};

export type SigninRequest = {
  email: string;
  password: string;
};

export type SigninResponse = {
  token: string;
};

export type UserGetResponse = {
  name: string;
  iconUrl: string;
};

export type UserUpdateRequest = {
  name: string;
};

export type UserUpdateResponse = {
  name: string;
};

// === アイコンアップロード関連型 ===
export type IconUploadResponse = {
  iconUrl: string;
};

// === 書籍関連型 ===
export type BookCreateRequest = {
  title: string;
  url: string;
  detail: string;
  review: string;
};

export type BookData = {
  id: string;
  title: string;
  url: string;
  detail: string;
  review: string;
  reviewer: string;
  isMine: boolean;
};

export type PublicBookData = {
  id: string;
  title: string;
  url: string;
  detail: string;
  review: string;
  reviewer: string;
};

// === 環境変数からAPIエンドポイントを取得 ===
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_USERS_URL = import.meta.env.VITE_API_USERS_URL;
const API_SIGNIN_URL = import.meta.env.VITE_API_SIGNIN_URL;
const API_UPLOADS_URL = import.meta.env.VITE_API_UPLOADS_URL;

// === エラーハンドリング関数 ===
const handleApiError = async (response: Response): Promise<never> => {
  const errorData: ApiError = await response.json();
  throw new Error(errorData.ErrorMessageJP || "APIエラーが発生しました");
};

// === ユーザー作成API ===
export const createUser = async (
  userData: UserCreateRequest,
): Promise<UserCreateResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_USERS_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return await response.json();
};

// === ユーザー認証API ===
export const authenticateUser = async (
  email: string,
  password: string,
): Promise<SigninResponse> => {
  const signinData: SigninRequest = { email, password };

  const response = await fetch(`${API_BASE_URL}${API_SIGNIN_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(signinData),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return await response.json();
};

// === アイコンアップロードAPI ===
export const uploadIcon = async (
  iconFile: File,
  token: string,
): Promise<IconUploadResponse> => {
  const formData = new FormData();
  formData.append("icon", iconFile);

  const response = await fetch(`${API_BASE_URL}${API_UPLOADS_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return await response.json();
};

// === ユーザー情報取得API ===
export const getUserInfo = async (token: string): Promise<UserGetResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_USERS_URL}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return await response.json();
};

// === ユーザー情報更新API ===
export const updateUser = async (
  userData: UserUpdateRequest,
  token: string,
): Promise<UserUpdateResponse> => {
  const response = await fetch(`${API_BASE_URL}${API_USERS_URL}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return await response.json();
};
