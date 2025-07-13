import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "../components/AuthProvider";
import LoginPage from "./LoginPage";
import { authenticateUser, getUserInfo } from "../services/api";

// APIサービスをモック
vi.mock("../services/api", () => ({
  authenticateUser: vi.fn(),
  getUserInfo: vi.fn(),
}));

// モックされたAPIサービスの型定義
const mockAuthenticateUser = vi.mocked(authenticateUser);
const mockGetUserInfo = vi.mocked(getUserInfo);

// localStorageをモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// console.logをモック化
vi.spyOn(console, "log").mockImplementation(() => {});

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("LoginPage", () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // デフォルトのAPIレスポンスを設定
    mockAuthenticateUser.mockResolvedValue({
      token: "mock-token",
    });

    mockGetUserInfo.mockResolvedValue({
      name: "Test User",
      iconUrl: "https://example.com/icon.png",
    });
  });

  it("ログインフォームが正しく表示される", () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "ログイン",
    );
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログイン" }),
    ).toBeInTheDocument();
  });

  it("空のフィールドでバリデーションエラーが表示される", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    const submitButton = screen.getByRole("button", { name: "ログイン" });

    // 空のフォームを送信
    await user.click(submitButton);

    // バリデーションエラーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "メールアドレスは必須です",
      );
      expect(screen.getByTestId("password-error")).toHaveTextContent(
        "パスワードは必須です",
      );
    });
  });

  it("無効なメール形式でバリデーションエラーが表示される", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    const emailInput = screen.getByLabelText("メールアドレス");
    const submitButton = screen.getByRole("button", { name: "ログイン" });

    // 無効なメールアドレスを入力
    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "正しいメールアドレス形式で入力してください",
      );
    });
  });

  it("短いパスワードでバリデーションエラーが表示される", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    const passwordInput = screen.getByLabelText("パスワード");
    const submitButton = screen.getByRole("button", { name: "ログイン" });

    // 短いパスワードを入力
    await user.type(passwordInput, "123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId("password-error")).toHaveTextContent(
        "パスワードは6文字以上で入力してください",
      );
    });
  });

  it("有効なデータでフォームが送信される", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    const emailInput = screen.getByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");
    const submitButton = screen.getByRole("button", { name: "ログイン" });

    // 有効なデータを入力
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // フォームを送信
    await user.click(submitButton);

    // APIが呼ばれることを確認
    await waitFor(() => {
      expect(mockAuthenticateUser).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });

    // 成功メッセージが表示されることを確認
    await waitFor(
      () => {
        expect(
          screen.getByText("ログインに成功しました！"),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("フォーム送信中にローディング状態が表示される", async () => {
    // APIレスポンスを遅延させる
    mockAuthenticateUser.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                token: "mock-token",
              }),
            100,
          ),
        ),
    );

    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    const emailInput = screen.getByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");
    const submitButton = screen.getByRole("button", { name: "ログイン" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    await user.click(submitButton);

    // ローディング状態のボタンが表示されることを確認
    await waitFor(() => {
      const loadingButton = screen.getByRole("button", {
        name: "ログイン中...",
      });
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
    });
  });

  it("API エラー時にエラーメッセージが表示される", async () => {
    // APIエラーをモック
    mockAuthenticateUser.mockRejectedValue(new Error("認証に失敗しました"));

    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    const emailInput = screen.getByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");
    const submitButton = screen.getByRole("button", { name: "ログイン" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText("認証に失敗しました")).toBeInTheDocument();
    });
  });

  it("フォーム入力の変更が正しく処理される", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    const emailInput = screen.getByLabelText(
      "メールアドレス",
    ) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      "パスワード",
    ) as HTMLInputElement;

    // 入力値の変更をテスト
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "mypassword");

    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("mypassword");
  });

  it("入力フィールドに正しいプレースホルダーが設定されている", () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    expect(
      screen.getByPlaceholderText("example@email.com"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワードを入力")).toBeInTheDocument();
  });

  it("パスワード入力フィールドのタイプが正しい", () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>,
    );

    const passwordInput = screen.getByLabelText("パスワード");
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
