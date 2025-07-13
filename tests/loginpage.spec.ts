import { test, expect } from "@playwright/test";

test.describe("ログイン画面のバリデーションテスト", () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動
    // await page.goto(`${process.env.DEV_URL}/login`);
    await page.goto(`http://localhost:5173/login`);
  });

  test("ページが正しく表示される", async ({ page }) => {
    // ページタイトルの確認
    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();

    // フォーム要素の確認
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("メールアドレスが空の場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    // パスワードのみ入力
    await page.locator("#password").fill("password123");

    // ログインボタンをクリック
    await page.getByRole("button", { name: "ログイン" }).click();

    // メールアドレスのエラーメッセージが表示されることを確認
    await expect(page.getByTestId("email-error")).toBeVisible();
    await expect(page.getByTestId("email-error")).toHaveText(
      "メールアドレスは必須です",
    );
  });

  test("メールアドレスの形式が不正な場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    // 不正なメールアドレスを入力
    await page.getByLabel("メールアドレス").fill("invalid-email");
    await page.locator("#password").fill("password123");

    // ログインボタンをクリック
    await page.getByRole("button", { name: "ログイン" }).click();

    // メールアドレスのエラーメッセージが表示されることを確認
    await expect(page.getByTestId("email-error")).toBeVisible();
    await expect(page.getByTestId("email-error")).toHaveText(
      "正しいメールアドレス形式で入力してください",
    );
  });

  test("パスワードが空の場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    // メールアドレスのみ入力
    await page.getByLabel("メールアドレス").fill("test@example.com");

    // ログインボタンをクリック
    await page.getByRole("button", { name: "ログイン" }).click();

    // パスワードのエラーメッセージが表示されることを確認
    await expect(page.getByTestId("password-error")).toBeVisible();
    await expect(page.getByTestId("password-error")).toHaveText(
      "パスワードは必須です",
    );
  });

  test("パスワードが6文字未満の場合、エラーメッセージが表示される", async ({
    page,
  }) => {
    // 短いパスワードを入力
    await page.getByLabel("メールアドレス").fill("test@example.com");
    await page.locator("#password").fill("123");

    // ログインボタンをクリック
    await page.getByRole("button", { name: "ログイン" }).click();

    // パスワードのエラーメッセージが表示されることを確認
    await expect(page.getByTestId("password-error")).toBeVisible();
    await expect(page.getByTestId("password-error")).toHaveText(
      "パスワードは6文字以上で入力してください",
    );
  });

  test("両方のフィールドが空の場合、両方のエラーメッセージが表示される", async ({
    page,
  }) => {
    // 何も入力せずにログインボタンをクリック
    await page.getByRole("button", { name: "ログイン" }).click();

    // 両方のエラーメッセージが表示されることを確認
    await expect(page.getByTestId("email-error")).toBeVisible();
    await expect(page.getByTestId("email-error")).toHaveText(
      "メールアドレスは必須です",
    );

    await expect(page.getByTestId("password-error")).toBeVisible();
    await expect(page.getByTestId("password-error")).toHaveText(
      "パスワードは必須です",
    );
  });

  test("正しい入力値の場合、エラーメッセージが表示されない", async ({
    page,
  }) => {
    // 正しい値を入力
    await page.getByLabel("メールアドレス").fill("test@example.com");
    await page.locator("#password").fill("password123");

    // ログインボタンをクリック
    await page.getByRole("button", { name: "ログイン" }).click();

    // エラーメッセージが表示されないことを確認
    await expect(page.getByTestId("email-error")).not.toBeVisible();
    await expect(page.getByTestId("password-error")).not.toBeVisible();
  });
});
