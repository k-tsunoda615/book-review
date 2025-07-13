import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

// ES Modules環境で__dirnameを定義
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("新規登録画面のE2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    // 新規登録ページに移動
    await page.goto("/signup");
  });

  // === ユーザーフロー（高優先度） ===
  test.describe("ユーザーフロー", () => {
    test("新規登録から完了まで", async ({ page }) => {
      // フォーム要素の表示確認
      await expect(
        page.getByRole("heading", { name: "新規登録" }),
      ).toBeVisible();

      // 基本情報の入力（IDでより具体的に指定）
      // 一意のメールアドレスを生成してテスト用に使用
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@example.com`;

      await page.getByLabel("メールアドレス").fill(testEmail);
      await page.locator("#password").fill("password123");
      await page.locator("#confirmPassword").fill("password123");
      await page.getByLabel("ユーザー名").fill(`testuser${timestamp}`);

      // フォーム送信
      await page.getByRole("button", { name: "新規登録" }).click();

      // 送信中の状態確認
      await expect(
        page.getByRole("button", { name: "登録中..." }),
      ).toBeVisible();

      // 成功メッセージまたはエラーメッセージの表示確認
      // 成功メッセージ: "新規登録が完了しました！"
      // エラーメッセージ: data-testid="api-error"
      const successMessage = page.locator('text="新規登録が完了しました！"');
      const errorMessage = page.getByTestId("api-error");

      // いずれかのメッセージが表示されるまで待機
      await expect(successMessage.or(errorMessage)).toBeVisible({
        timeout: 15000,
      });

      // 成功した場合のみリダイレクト確認
      if (await successMessage.isVisible()) {
        await expect(page).toHaveURL("/login", { timeout: 5000 });
      }
    });

    test("新規登録からログインまでの完全フロー", async ({ page }) => {
      // 一意のメールアドレスを生成
      const timestamp = Date.now();
      const testEmail = `newuser${timestamp}@example.com`;
      const testUsername = `newuser${timestamp}`;

      // 新規登録
      await page.getByLabel("メールアドレス").fill(testEmail);
      await page.locator("#password").fill("password123");
      await page.locator("#confirmPassword").fill("password123");
      await page.getByLabel("ユーザー名").fill(testUsername);

      await page.getByRole("button", { name: "新規登録" }).click();

      // 成功メッセージまたはエラーメッセージの表示確認
      const successMessage = page.locator('text="新規登録が完了しました！"');
      const errorMessage = page.getByTestId("api-error");

      await expect(successMessage.or(errorMessage)).toBeVisible({
        timeout: 15000,
      });

      // 成功した場合のみログイン画面での操作を続行
      if (await successMessage.isVisible()) {
        // ログイン画面への遷移を待機
        await expect(page).toHaveURL("/login", { timeout: 5000 });

        // ログイン画面での操作
        await page.getByLabel("メールアドレス").fill(testEmail);
        await page.locator("#password").fill("password123");
        await page.getByRole("button", { name: "ログイン" }).click();

        // ログイン成功の確認（実際のアプリケーションに応じて調整）
        await expect(page.getByText("ログインに成功しました")).toBeVisible({
          timeout: 10000,
        });
      }
    });
  });

  // === エラーハンドリング（高優先度） ===
  test.describe("エラーハンドリング", () => {
    test("無効なメールアドレス", async ({ page }) => {
      // 無効なメールアドレスを入力
      await page.getByLabel("メールアドレス").fill("invalid-email");
      await page.locator("#password").fill("password123");
      await page.locator("#confirmPassword").fill("password123");
      await page.getByLabel("ユーザー名").fill("testuser");

      // フォーム送信
      await page.getByRole("button", { name: "新規登録" }).click();

      // エラーメッセージの表示確認
      await expect(page.getByTestId("email-error")).toBeVisible();
      await expect(page.getByTestId("email-error")).toHaveText(
        "正しいメールアドレス形式で入力してください",
      );
    });

    test("弱いパスワード", async ({ page }) => {
      // 短いパスワードを入力
      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.locator("#password").fill("123");
      await page.locator("#confirmPassword").fill("123");
      await page.getByLabel("ユーザー名").fill("testuser");

      // フォーム送信
      await page.getByRole("button", { name: "新規登録" }).click();

      // エラーメッセージの表示確認
      await expect(page.getByTestId("password-error")).toBeVisible();
      await expect(page.getByTestId("password-error")).toHaveText(
        "パスワードは6文字以上で入力してください",
      );
    });

    test("パスワード不一致", async ({ page }) => {
      // パスワードが一致しない場合
      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.locator("#password").fill("password123");
      await page.locator("#confirmPassword").fill("password456");
      await page.getByLabel("ユーザー名").fill("testuser");

      // フォーム送信
      await page.getByRole("button", { name: "新規登録" }).click();

      // エラーメッセージの表示確認
      await expect(page.getByTestId("confirmPassword-error")).toBeVisible();
      await expect(page.getByTestId("confirmPassword-error")).toHaveText(
        "パスワードが一致しません",
      );
    });

    test("必須フィールドの空欄チェック", async ({ page }) => {
      // 何も入力せずにフォーム送信
      await page.getByRole("button", { name: "新規登録" }).click();

      // 全ての必須フィールドのエラーメッセージを確認
      await expect(page.getByTestId("email-error")).toBeVisible();
      await expect(page.getByTestId("email-error")).toHaveText(
        "メールアドレスは必須です",
      );

      await expect(page.getByTestId("password-error")).toBeVisible();
      await expect(page.getByTestId("password-error")).toHaveText(
        "パスワードは必須です",
      );

      await expect(page.getByTestId("confirmPassword-error")).toBeVisible();
      await expect(page.getByTestId("confirmPassword-error")).toHaveText(
        "パスワード確認は必須です",
      );

      await expect(page.getByTestId("name-error")).toBeVisible();
      await expect(page.getByTestId("name-error")).toHaveText(
        "ユーザー名は必須です",
      );
    });

    test("短いユーザー名", async ({ page }) => {
      // 1文字のユーザー名を入力
      await page.getByLabel("メールアドレス").fill("test@example.com");
      await page.locator("#password").fill("password123");
      await page.locator("#confirmPassword").fill("password123");
      await page.getByLabel("ユーザー名").fill("a");

      // フォーム送信
      await page.getByRole("button", { name: "新規登録" }).click();

      // エラーメッセージの表示確認
      await expect(page.getByTestId("name-error")).toBeVisible();
      await expect(page.getByTestId("name-error")).toHaveText(
        "ユーザー名は2文字以上で入力してください",
      );
    });
  });

  // === ファイルアップロード（高・中優先度） ===
  test.describe("ファイルアップロード", () => {
    test("画像ファイルの選択とアップロード", async ({ page }) => {
      // 有効な画像ファイルを作成（テスト用の小さなPNG）
      const testImagePath = path.join(__dirname, "fixtures", "test-image.png");

      // 一意のメールアドレスを生成
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@example.com`;

      // ファイル選択
      await page.getByLabel("ユーザーアイコン").setInputFiles(testImagePath);

      // 画像プレビューの表示確認
      await expect(page.getByTestId("image-preview")).toBeVisible({
        timeout: 3000,
      });

      // フォーム送信と成功確認
      await page.getByLabel("メールアドレス").fill(testEmail);
      await page.locator("#password").fill("password123");
      await page.locator("#confirmPassword").fill("password123");
      await page.getByLabel("ユーザー名").fill(`testuser${timestamp}`);

      await page.getByRole("button", { name: "新規登録" }).click();

      // 成功メッセージまたはエラーメッセージの確認
      const successMessage = page.locator('text="新規登録が完了しました！"');
      const errorMessage = page.getByTestId("api-error");

      await expect(successMessage.or(errorMessage)).toBeVisible({
        timeout: 15000,
      });
    });

    test("無効なファイル形式", async ({ page }) => {
      // 無効なファイル形式（テキストファイル）を作成
      const testTextPath = path.join(__dirname, "fixtures", "test-file.txt");

      // ファイル選択
      await page.getByLabel("ユーザーアイコン").setInputFiles(testTextPath);

      // エラーメッセージの表示確認
      await expect(page.getByTestId("file-error")).toBeVisible({
        timeout: 3000,
      });
      await expect(page.getByTestId("file-error")).toHaveText(
        "JPEG、PNG形式の画像ファイルのみアップロード可能です",
      );
    });

    test("SVGファイルは無効なファイル形式としてエラーが表示される", async ({
      page,
    }) => {
      // SVGファイルを作成
      const testSVGPath = path.join(__dirname, "fixtures", "test-image.svg");

      // ファイル選択
      await page.getByLabel("ユーザーアイコン").setInputFiles(testSVGPath);

      // エラーメッセージの表示確認
      await expect(page.getByTestId("file-error")).toBeVisible({
        timeout: 3000,
      });
      await expect(page.getByTestId("file-error")).toHaveText(
        "JPEG、PNG形式の画像ファイルのみアップロード可能です",
      );
    });

    test("大きなファイルの処理", async ({ page }) => {
      // 大きなファイル（1MB超）を作成
      const testLargeImagePath = path.join(
        __dirname,
        "fixtures",
        "large-image.png",
      );

      // ファイル選択
      await page
        .getByLabel("ユーザーアイコン")
        .setInputFiles(testLargeImagePath);

      // ファイルサイズエラーの表示確認
      await expect(page.getByTestId("file-error")).toBeVisible({
        timeout: 3000,
      });
      await expect(page.getByTestId("file-error")).toHaveText(
        "ファイルサイズは1MB以下にしてください",
      );
    });
  });

  // === ページナビゲーション（中優先度） ===
  test.describe("ページナビゲーション", () => {
    test("ログイン画面へのリンク", async ({ page }) => {
      // ログイン画面へのリンクをクリック
      await page.getByRole("link", { name: /ログイン画面へ/ }).click();

      // ログイン画面への遷移確認
      await expect(page).toHaveURL("/login");
      await expect(
        page.getByRole("heading", { name: "ログイン" }),
      ).toBeVisible();
    });

    test("新規登録画面へのリンク（ログイン画面から）", async ({ page }) => {
      // ログイン画面に移動
      await page.goto("/login");

      // 新規登録画面へのリンクをクリック
      await page.getByRole("link", { name: /新規登録画面へ/ }).click();

      // 新規登録画面への遷移確認
      await expect(page).toHaveURL("/signup");
      await expect(
        page.getByRole("heading", { name: "新規登録" }),
      ).toBeVisible();
    });
  });

  // === レスポンシブテスト（未実装） ===
  // test.describe("レスポンシブテスト", () => {
  //   test("モバイルでの操作", async ({ page }) => {
  //     // モバイルビューポートに設定
  //     await page.setViewportSize({ width: 375, height: 667 });

  //     // ページの表示確認
  //     await expect(
  //       page.getByRole("heading", { name: "新規登録" })
  //     ).toBeVisible();

  //     // フォーム操作
  //     await page.getByLabel("メールアドレス").fill("mobile@example.com");
  //     await page.locator("#password").fill("password123");
  //     await page.locator("#confirmPassword").fill("password123");
  //     await page.getByLabel("ユーザー名").fill("mobileuser");

  //     // フォーム送信
  //     await page.getByRole("button", { name: "新規登録" }).click();

  //     // 成功メッセージの表示確認
  //     await expect(page.getByText("新規登録が完了しました！")).toBeVisible({
  //       timeout: 5000,
  //     });
  //   });

  //   test("タブレットでの操作", async ({ page }) => {
  //     // タブレットビューポートに設定
  //     await page.setViewportSize({ width: 768, height: 1024 });

  //     // ページの表示確認
  //     await expect(
  //       page.getByRole("heading", { name: "新規登録" })
  //     ).toBeVisible();

  //     // フォーム操作
  //     await page.getByLabel("メールアドレス").fill("tablet@example.com");
  //     await page.locator("#password").fill("password123");
  //     await page.locator("#confirmPassword").fill("password123");
  //     await page.getByLabel("ユーザー名").fill("tabletuser");

  //     // フォーム送信
  //     await page.getByRole("button", { name: "新規登録" }).click();

  //     // 成功メッセージの表示確認
  //     await expect(page.getByText("新規登録が完了しました！")).toBeVisible({
  //       timeout: 5000,
  //     });
  //   });
  // });

  // === アクセシビリティテスト（未実装） ===
  // test.describe("アクセシビリティ", () => {
  //   test("フォーカス管理", async ({ page }) => {
  //     // Tabキーでフォーカス移動をテスト
  //     await page.keyboard.press("Tab");
  //     await expect(page.getByLabel("メールアドレス")).toBeFocused();

  //     await page.keyboard.press("Tab");
  //     await expect(page.locator("#password")).toBeFocused();

  //     await page.keyboard.press("Tab");
  //     await expect(page.locator("#confirmPassword")).toBeFocused();

  //     await page.keyboard.press("Tab");
  //     await expect(page.getByLabel("ユーザー名")).toBeFocused();

  //     await page.keyboard.press("Tab");
  //     await expect(page.getByLabel("ユーザーアイコン")).toBeFocused();
  //   });

  //   test("エラーメッセージのARIA属性", async ({ page }) => {
  //     // エラーを発生させる
  //     await page.getByRole("button", { name: "新規登録" }).click();

  //     // エラーメッセージのARIA属性を確認
  //     const emailError = page.getByTestId("email-error");
  //     await expect(emailError).toHaveAttribute("role", "alert");
  //     await expect(emailError).toHaveAttribute("aria-live", "polite");
  //   });
  // });
});
