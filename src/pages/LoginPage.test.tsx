import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "./LoginPage";

// console.logをモック化
// vi.spyOn(console, "log")：console.logメソッドをスパイ（監視）する
// .mockImplementation(() => {})：実際のconsole.logの代わりに空の関数を実行する
// これにより、console.logの呼び出しは記録されるが、実際のコンソール出力は行われない
vi.spyOn(console, "log").mockImplementation(() => {});

describe("LoginPage", () => {
  it("ログインフォームが正しく表示される", () => {
    render(<LoginPage />);

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
    render(<LoginPage />);

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
    render(<LoginPage />);

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
    render(<LoginPage />);

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
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("メールアドレス");
    const passwordInput = screen.getByLabelText("パスワード");
    const submitButton = screen.getByRole("button", { name: "ログイン" });

    // 有効なデータを入力
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // フォームを送信
    await user.click(submitButton);

    // ローディング状態を確認
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "ログイン中..." }),
      ).toBeInTheDocument();
    });

    // 成功メッセージが表示されることを確認
    await waitFor(
      () => {
        expect(
          screen.getByText("ログインに成功しました！"),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // console.logが呼ばれることを確認
    expect(console.log).toHaveBeenCalledWith("ログイン処理:", {
      email: "test@example.com",
      password: "password123",
    });
  });

  it("フォーム送信中にローディング状態が表示される", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

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

  it("フォーム入力の変更が正しく処理される", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

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
    render(<LoginPage />);

    expect(
      screen.getByPlaceholderText("example@email.com"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワードを入力")).toBeInTheDocument();
  });

  it("パスワード入力フィールドのタイプが正しい", () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText("パスワード");
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
