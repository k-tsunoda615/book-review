import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import SignupPage from "./SignupPage";
import * as api from "../services/api";

// Compressor.jsのモック
vi.mock("compressorjs", () => ({
  default: vi.fn(),
}));

// API関数のモック
vi.mock("../services/api", () => ({
  createUser: vi.fn(),
  uploadIcon: vi.fn(),
}));

// React Router のモック
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// テスト用のラッパーコンポーネント
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// テストファイル作成のヘルパー関数群
const TestFileFactory = {
  // 小さなPNG画像（圧縮対象外）
  createSmallPNG: (name = "small.png") => {
    const file = new File(["small image data"], name, { type: "image/png" });
    Object.defineProperty(file, "size", { value: 100 * 1024 }); // 100KB
    return file;
  },

  // 大きなPNG画像（圧縮対象）
  createLargePNG: (name = "large.png") => {
    const file = new File(["large image data"], name, { type: "image/png" });
    Object.defineProperty(file, "size", { value: 800 * 1024 }); // 800KB
    return file;
  },

  // 制限を超える大きなファイル
  createOversizedFile: (name = "oversized.png") => {
    const file = new File(["oversized image data"], name, {
      type: "image/png",
    });
    Object.defineProperty(file, "size", { value: 2 * 1024 * 1024 }); // 2MB
    return file;
  },

  // JPEG画像
  createJPEG: (name = "test.jpg") => {
    const file = new File(["jpeg image data"], name, { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 200 * 1024 }); // 200KB
    return file;
  },

  // 無効な形式のファイル
  createInvalidFile: (name = "invalid.txt", type = "text/plain") => {
    const file = new File(["invalid file data"], name, { type });
    Object.defineProperty(file, "size", { value: 50 * 1024 }); // 50KB
    return file;
  },

  // SVGファイル
  createSVG: (name = "test.svg") => {
    const file = new File(["<svg>test</svg>"], name, { type: "image/svg+xml" });
    Object.defineProperty(file, "size", { value: 10 * 1024 }); // 10KB
    return file;
  },
};

// UserEventのセットアップ型
type UserEventSetup = ReturnType<typeof userEvent.setup>;

// フォーム入力のヘルパー関数
const FormHelpers = {
  // 有効なフォームデータを入力
  fillValidForm: async (
    user: UserEventSetup,
    overrides: Partial<{
      email: string;
      password: string;
      confirmPassword: string;
      name: string;
    }> = {},
  ) => {
    const defaults = {
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
      name: "testuser",
    };
    const data = { ...defaults, ...overrides };

    await user.type(screen.getByLabelText("メールアドレス"), data.email);
    await user.type(screen.getByLabelText("パスワード"), data.password);
    await user.type(
      screen.getByLabelText("パスワード確認"),
      data.confirmPassword,
    );
    await user.type(screen.getByLabelText("ユーザー名"), data.name);
  },

  // ファイルをアップロード
  uploadFile: async (user: UserEventSetup, file: File) => {
    const fileInput = screen.getByLabelText("ユーザーアイコン");
    await act(async () => {
      await user.upload(fileInput, file);
    });
  },

  // フォーム送信
  submitForm: async (user: UserEventSetup) => {
    const submitButton = screen.getByRole("button", { name: "新規登録" });
    await user.click(submitButton);
  },
};

// Compressor.jsのモック設定ヘルパー
const CompressorMockHelpers = {
  // 成功時のモック
  mockSuccess: async (compressedSize = 300 * 1024) => {
    const mockCompressor = vi.mocked((await import("compressorjs")).default);
    mockCompressor.mockImplementation((file, options) => {
      if (options && options.success) {
        const compressedFile = new File(["compressed"], "compressed.png", {
          type: "image/png",
        });
        Object.defineProperty(compressedFile, "size", {
          value: compressedSize,
        });
        options.success(compressedFile);
      }
      return {} as never;
    });
    return mockCompressor;
  },

  // エラー時のモック
  mockError: async (errorMessage = "圧縮に失敗しました") => {
    const mockCompressor = vi.mocked((await import("compressorjs")).default);
    mockCompressor.mockImplementation((file, options) => {
      if (options && options.error) {
        options.error(new Error(errorMessage));
      }
      return {} as never;
    });
    return mockCompressor;
  },

  // 呼び出されないモック（小さなファイル用）
  mockNotCalled: async () => {
    const mockCompressor = vi.mocked((await import("compressorjs")).default);
    mockCompressor.mockImplementation(() => {
      return {} as never;
    });
    return mockCompressor;
  },
};

// カスタムマッチャー
const CustomMatchers = {
  // エラーメッセージが表示されているかチェック
  expectErrorMessage: (testId: string, message: string) => {
    expect(screen.getByTestId(testId)).toHaveTextContent(message);
  },

  // 要素が存在するかチェック
  expectElementExists: (selector: string) => {
    expect(screen.getByRole("button", { name: selector })).toBeInTheDocument();
  },

  // API呼び出しが正しく行われたかチェック
  expectAPICall: (mockFn: ReturnType<typeof vi.fn>, expectedData: unknown) => {
    expect(mockFn).toHaveBeenCalledWith(expectedData);
  },
};

// 共通テストケースのヘルパー
const CommonTestCases = {
  // バリデーションエラーのテスト
  testValidationError: async (
    user: UserEventSetup,
    inputData: Partial<{
      email: string;
      password: string;
      confirmPassword: string;
      name: string;
    }>,
    expectedError: { testId: string; message: string },
  ) => {
    render(
      <TestWrapper>
        <SignupPage />
      </TestWrapper>,
    );

    await FormHelpers.fillValidForm(user, inputData);
    await FormHelpers.submitForm(user);

    // バリデーションエラーが表示されるまで待機
    await waitFor(
      () => {
        CustomMatchers.expectErrorMessage(
          expectedError.testId,
          expectedError.message,
        );
      },
      { timeout: 3000 },
    );
  },

  // ファイルアップロードのテスト
  testFileUpload: async (
    user: UserEventSetup,
    file: File,
    expectPreview: boolean = true,
    expectedError?: { testId: string; message: string },
  ) => {
    render(
      <TestWrapper>
        <SignupPage />
      </TestWrapper>,
    );

    await FormHelpers.uploadFile(user, file);

    // ファイル処理が完了するまで待機
    await waitFor(
      () => {
        if (expectedError) {
          CustomMatchers.expectErrorMessage(
            expectedError.testId,
            expectedError.message,
          );
        } else if (expectPreview) {
          expect(screen.getByTestId("image-preview")).toBeInTheDocument();
        }
      },
      { timeout: 3000 },
    );
  },
};

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.logのモック
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // === 基本表示テスト ===
  describe("基本表示", () => {
    it("新規登録フォームが正しく表示される", () => {
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      expect(
        screen.getByRole("heading", { name: "新規登録" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
      expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
      expect(screen.getByLabelText("パスワード確認")).toBeInTheDocument();
      expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
      expect(screen.getByLabelText("ユーザーアイコン")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "新規登録" }),
      ).toBeInTheDocument();
    });

    it("ログイン画面へのリンクが表示される", () => {
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const loginLink = screen.getByRole("link", { name: /ログイン画面へ/ });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  // === バリデーションテスト ===
  describe("バリデーション", () => {
    it("必須フィールドが空の場合エラーが表示される", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const submitButton = screen.getByRole("button", { name: "新規登録" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "メールアドレスは必須です",
        );
        expect(screen.getByTestId("password-error")).toHaveTextContent(
          "パスワードは必須です",
        );
        expect(screen.getByTestId("confirmPassword-error")).toHaveTextContent(
          "パスワード確認は必須です",
        );
        expect(screen.getByTestId("name-error")).toHaveTextContent(
          "ユーザー名は必須です",
        );
      });
    });

    it("無効なメール形式でエラーが表示される", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // 無効なメールアドレスと他の必須フィールドを入力
      await user.type(screen.getByLabelText("メールアドレス"), "invalid-email");
      await user.type(screen.getByLabelText("パスワード"), "password123");
      await user.type(screen.getByLabelText("パスワード確認"), "password123");
      await user.type(screen.getByLabelText("ユーザー名"), "testuser");

      // フォーム送信
      const submitButton = screen.getByRole("button", { name: "新規登録" });
      await user.click(submitButton);

      // バリデーションエラーが表示されるまで待機
      await waitFor(
        () => {
          expect(screen.getByTestId("email-error")).toHaveTextContent(
            "正しいメールアドレス形式で入力してください",
          );
        },
        { timeout: 3000 },
      );
    });

    it("弱いパスワードでエラーが表示される", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // 弱いパスワードと他の必須フィールドを入力
      await user.type(
        screen.getByLabelText("メールアドレス"),
        "test@example.com",
      );
      await user.type(screen.getByLabelText("パスワード"), "123");
      await user.type(screen.getByLabelText("パスワード確認"), "123");
      await user.type(screen.getByLabelText("ユーザー名"), "testuser");

      // フォーム送信
      const submitButton = screen.getByRole("button", { name: "新規登録" });
      await user.click(submitButton);

      // バリデーションエラーが表示されるまで待機
      await waitFor(
        () => {
          expect(screen.getByTestId("password-error")).toHaveTextContent(
            "パスワードは6文字以上で入力してください",
          );
        },
        { timeout: 3000 },
      );
    });

    it("パスワード確認が一致しない場合エラーが表示される", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // パスワード不一致と他の必須フィールドを入力
      await user.type(
        screen.getByLabelText("メールアドレス"),
        "test@example.com",
      );
      await user.type(screen.getByLabelText("パスワード"), "password123");
      await user.type(screen.getByLabelText("パスワード確認"), "password456");
      await user.type(screen.getByLabelText("ユーザー名"), "testuser");

      // フォーム送信
      const submitButton = screen.getByRole("button", { name: "新規登録" });
      await user.click(submitButton);

      // バリデーションエラーが表示されるまで待機
      await waitFor(
        () => {
          expect(screen.getByTestId("confirmPassword-error")).toHaveTextContent(
            "パスワードが一致しません",
          );
        },
        { timeout: 3000 },
      );
    });

    it("ユーザー名が短すぎる場合エラーが表示される", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // 短いユーザー名と他の必須フィールドを入力
      await user.type(
        screen.getByLabelText("メールアドレス"),
        "test@example.com",
      );
      await user.type(screen.getByLabelText("パスワード"), "password123");
      await user.type(screen.getByLabelText("パスワード確認"), "password123");
      await user.type(screen.getByLabelText("ユーザー名"), "a");

      // フォーム送信
      const submitButton = screen.getByRole("button", { name: "新規登録" });
      await user.click(submitButton);

      // バリデーションエラーが表示されるまで待機
      await waitFor(
        () => {
          expect(screen.getByTestId("name-error")).toHaveTextContent(
            "ユーザー名は2文字以上で入力してください",
          );
        },
        { timeout: 3000 },
      );
    });
  });

  // === ファイルアップロードテスト ===
  describe("ファイルアップロード", () => {
    it("実際のPNG画像ファイルがアップロードされる", async () => {
      const user = userEvent.setup();
      const testFile = TestFileFactory.createSmallPNG();
      await CommonTestCases.testFileUpload(user, testFile, true);
    });

    // NOTE: 以下のファイル形式バリデーションテストはE2Eテストでカバーします
    // - SVGファイルの無効形式エラー
    // - 無効なファイル形式のエラー
    // React Testing LibraryのuserEvent.uploadの制約により、
    // これらのテストは実際のブラウザ環境でのみ正確にテストできます

    it("ファイルサイズが大きすぎる場合エラーが表示される", async () => {
      const user = userEvent.setup();
      const largeFile = TestFileFactory.createOversizedFile();

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const fileInput = screen.getByLabelText("ユーザーアイコン");
      await act(async () => {
        await user.upload(fileInput, largeFile);
      });

      // ファイルエラーが表示されるまで待機
      await waitFor(
        () => {
          expect(screen.getByTestId("file-error")).toHaveTextContent(
            "ファイルサイズは1MB以下にしてください",
          );
        },
        { timeout: 3000 },
      );
    });

    it("画像プレビューが表示される", async () => {
      const user = userEvent.setup();
      const testFile = TestFileFactory.createSmallPNG();
      await CommonTestCases.testFileUpload(user, testFile, true);
    });
  });

  // === 画像圧縮テスト ===
  describe("画像圧縮", () => {
    it("Compressor.jsが実際の大きなファイルで呼び出される", async () => {
      const user = userEvent.setup();

      // 実際の大きなPNGファイルを読み込み（667KB > 512KB なので圧縮対象）
      const testFile = TestFileFactory.createLargePNG();

      // Compressor のモック取得と設定
      const mockCompressor = await CompressorMockHelpers.mockSuccess();

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const fileInput = screen.getByLabelText("ユーザーアイコン");

      await act(async () => {
        await user.upload(fileInput, testFile);
      });

      await waitFor(() => {
        expect(mockCompressor).toHaveBeenCalledWith(
          testFile,
          expect.objectContaining({
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 800,
          }),
        );
      });
    });

    it("小さなファイルは圧縮されない", async () => {
      const user = userEvent.setup();

      // 実際の小さなPNGファイルを読み込み（2.2KB < 512KB なので圧縮対象外）
      const testFile = TestFileFactory.createSmallPNG();

      // Compressor のモック取得と設定
      const mockCompressor = await CompressorMockHelpers.mockNotCalled();

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const fileInput = screen.getByLabelText("ユーザーアイコン");

      await act(async () => {
        await user.upload(fileInput, testFile);
      });

      // 小さなファイルは圧縮されない
      await waitFor(() => {
        expect(mockCompressor).not.toHaveBeenCalled();
      });
    });

    it("圧縮エラー時にエラーが表示される", async () => {
      const user = userEvent.setup();

      // 実際の大きなPNGファイルを読み込み（圧縮対象）
      const testFile = TestFileFactory.createLargePNG();

      // Compressor のエラーモック
      await CompressorMockHelpers.mockError();

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const fileInput = screen.getByLabelText("ユーザーアイコン");

      await act(async () => {
        await user.upload(fileInput, testFile);
      });

      await waitFor(() => {
        expect(screen.getByTestId("file-error")).toHaveTextContent(
          "画像の圧縮に失敗しました",
        );
      });
    });

    it("圧縮後のファイルサイズが制限内に収まる", async () => {
      const user = userEvent.setup();

      // 実際の大きなPNGファイルを読み込み
      const testFile = TestFileFactory.createLargePNG();

      // Compressor のモック - 圧縮後に小さなファイルを返す
      const mockCompressor = await CompressorMockHelpers.mockSuccess(
        400 * 1024,
      );

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const fileInput = screen.getByLabelText("ユーザーアイコン");

      await act(async () => {
        await user.upload(fileInput, testFile);
      });

      await waitFor(() => {
        expect(mockCompressor).toHaveBeenCalled();
        expect(screen.getByTestId("image-preview")).toBeInTheDocument();
        // エラーが表示されないことを確認
        expect(screen.queryByTestId("file-error")).not.toBeInTheDocument();
      });
    });
  });

  // === フォーム送信テスト ===
  describe("フォーム送信", () => {
    it("有効なデータでフォームが送信される", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        token: "test-token",
      };
      vi.mocked(api.createUser).mockResolvedValue(mockResponse);

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // フォーム入力
      await FormHelpers.fillValidForm(user);

      await FormHelpers.submitForm(user);

      await waitFor(() => {
        expect(api.createUser).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
          name: "testuser",
        });
      });
    });

    it("フォーム送信中にローディング状態が表示される", async () => {
      const user = userEvent.setup();
      // APIの応答を遅延させる
      vi.mocked(api.createUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // フォーム入力
      await FormHelpers.fillValidForm(user);

      await FormHelpers.submitForm(user);

      // ローディング状態を確認
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "登録中..." }),
        ).toBeInTheDocument();
      });
    });
  });

  // === APIインテグレーションテスト ===
  describe("APIインテグレーション", () => {
    it("APIエラー時にエラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(api.createUser).mockRejectedValue(
        new Error("メールアドレスが既に使用されています"),
      );

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // フォーム入力
      await FormHelpers.fillValidForm(user);

      await FormHelpers.submitForm(user);

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "メールアドレスが既に使用されています",
        );
      });
    });

    it("ファイル付きでAPIが正しく呼び出される", async () => {
      const user = userEvent.setup();
      const testFile = TestFileFactory.createSmallPNG();

      vi.mocked(api.createUser).mockResolvedValue({ token: "test-token" });
      vi.mocked(api.uploadIcon).mockResolvedValue({
        iconUrl: "https://example.com/icon.jpg",
      });

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // フォーム入力
      await FormHelpers.fillValidForm(user);

      await FormHelpers.uploadFile(user, testFile);

      await FormHelpers.submitForm(user);

      await waitFor(() => {
        expect(api.createUser).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
          name: "testuser",
        });
        expect(api.uploadIcon).toHaveBeenCalledWith(testFile, "test-token");
      });
    });

    it("APIエラーレスポンスが正しく処理される", async () => {
      const user = userEvent.setup();
      vi.mocked(api.createUser).mockRejectedValue(
        new Error("新規登録に失敗しました"),
      );

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // フォーム入力
      await FormHelpers.fillValidForm(user);

      await FormHelpers.submitForm(user);

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "新規登録に失敗しました",
        );
      });
    });
  });

  // === ナビゲーションテスト ===
  describe("ナビゲーション", () => {
    it("ログイン画面へのリンクが機能する", () => {
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const loginLink = screen.getByRole("link", { name: /ログイン画面へ/ });
      expect(loginLink).toHaveAttribute("href", "/login");
    });

    it("成功時にログイン画面へリダイレクトされる", async () => {
      const user = userEvent.setup();
      vi.mocked(api.createUser).mockResolvedValue({ token: "test-token" });

      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      // フォーム入力
      await FormHelpers.fillValidForm(user);

      await FormHelpers.submitForm(user);

      // 1秒後にナビゲーションが呼ばれる（実装でsetTimeoutを使用）
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/login");
        },
        { timeout: 2000 },
      );
    });
  });

  // === アクセシビリティテスト ===
  describe("アクセシビリティ", () => {
    it("すべての入力フィールドに適切なラベルが設定されている", () => {
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
      expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
      expect(screen.getByLabelText("パスワード確認")).toBeInTheDocument();
      expect(screen.getByLabelText("ユーザー名")).toBeInTheDocument();
      expect(screen.getByLabelText("ユーザーアイコン")).toBeInTheDocument();
    });

    it("エラーメッセージに適切なARIA属性が設定されている", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <SignupPage />
        </TestWrapper>,
      );

      const submitButton = screen.getByRole("button", { name: "新規登録" });
      await user.click(submitButton);

      await waitFor(() => {
        const emailError = screen.getByTestId("email-error");
        expect(emailError).toHaveAttribute("role", "alert");
        expect(emailError).toHaveAttribute("aria-live", "polite");
      });
    });
  });
});
