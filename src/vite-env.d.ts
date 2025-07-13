/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_SIGNIN_URL: string;
  readonly VITE_API_USERS_URL: string;
  readonly VITE_API_PUBLIC_BOOKS_URL: string;
  readonly VITE_API_BOOKS_URL: string;
  readonly VITE_API_BOOK_DETAIL_URL: string;
  readonly VITE_API_LOGS_URL: string;
  readonly VITE_API_UPLOADS_URL: string;
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};
