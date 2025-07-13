import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUser, uploadIcon } from "../services/api";
import Compressor from "compressorjs";

type SignupFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  avatar?: FileList;
};

function SignupPage() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // フォームフィールドをreact-hook-formに登録
  const {
    register,
    formState: { errors },
    watch,
    handleSubmit,
  } = useForm<SignupFormData>({
    mode: "onChange", // 入力値変更時にバリデーション実行
  });

  const password = watch("password");

  // ファイル処理関数
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setImagePreview(null);
    setCompressedFile(null);

    // ファイル形式チェック（Swagger仕様: jpg, png）
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("JPEG、PNG形式の画像ファイルのみアップロード可能です");
      return;
    }

    // ファイルサイズチェック（Swagger仕様: 1MB以下）
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setFileError("ファイルサイズは1MB以下にしてください");
      return;
    }

    // 画像プレビュー
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 画像圧縮処理を非同期で実行
    if (file.size > 512 * 1024) {
      try {
        new Compressor(file, {
          quality: 0.8,
          maxWidth: 800,
          maxHeight: 800,
          success: (compressedFile: File) => {
            setCompressedFile(compressedFile);
          },
          error: (error: Error) => {
            setFileError("画像の圧縮に失敗しました");
            console.error("Compression error:", error);
          },
        });
      } catch {
        // Compressor.jsが利用できない場合の処理
        setFileError("画像の圧縮に失敗しました");
        setCompressedFile(file);
      }
    } else {
      setCompressedFile(file);
    }
  };

  // フォーム送信処理
  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // ユーザー作成API呼び出し（Swagger仕様に基づく）
      const userResponse = await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // アバター画像がある場合は別途アップロード
      if (compressedFile && userResponse.token) {
        try {
          await uploadIcon(compressedFile, userResponse.token);
        } catch (iconError) {
          console.warn("アイコンアップロードに失敗しました:", iconError);
          // アイコンアップロード失敗は警告のみ（ユーザー作成は成功）
        }
      }

      // 成功時の処理
      setSuccess(true);

      // 成功時はログイン画面へリダイレクト
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "新規登録に失敗しました";
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-2xl font-bold mb-6">新規登録</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* メールアドレス */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            {...register("email", {
              required: "メールアドレスは必須です",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "正しいメールアドレス形式で入力してください",
              },
            })}
            className={`w-full px-3 py-2 border rounded-md text-base focus:outline-none focus:ring-2 focus:border-transparent ${
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="example@email.com"
          />
          {errors.email && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="email-error"
              role="alert"
              aria-live="polite"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* パスワード */}
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            パスワード
          </label>
          <input
            type="password"
            id="password"
            {...register("password", {
              required: "パスワードは必須です",
              minLength: {
                value: 6,
                message: "パスワードは6文字以上で入力してください",
              },
            })}
            className={`w-full px-3 py-2 border rounded-md text-base focus:outline-none focus:ring-2 focus:border-transparent ${
              errors.password
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="パスワードを入力"
          />
          {errors.password && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="password-error"
              role="alert"
              aria-live="polite"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* パスワード確認 */}
        <div className="mb-4">
          <label
            htmlFor="confirmPassword"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            パスワード確認
          </label>
          <input
            type="password"
            id="confirmPassword"
            {...register("confirmPassword", {
              required: "パスワード確認は必須です",
              validate: (value) =>
                value === password || "パスワードが一致しません",
            })}
            className={`w-full px-3 py-2 border rounded-md text-base focus:outline-none focus:ring-2 focus:border-transparent ${
              errors.confirmPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="パスワードを再入力"
          />
          {errors.confirmPassword && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="confirmPassword-error"
              role="alert"
              aria-live="polite"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* ユーザー名 */}
        <div className="mb-4">
          <label
            htmlFor="name"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            ユーザー名
          </label>
          <input
            id="name"
            type="text"
            {...register("name", {
              required: "ユーザー名は必須です",
              minLength: {
                value: 2,
                message: "ユーザー名は2文字以上で入力してください",
              },
            })}
            className={`w-full px-3 py-2 border rounded-md text-base focus:outline-none focus:ring-2 focus:border-transparent ${
              errors.name
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="ユーザー名を入力"
          />
          {errors.name && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="name-error"
              role="alert"
              aria-live="polite"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* ユーザーアイコン */}
        <div className="mb-4">
          <label
            htmlFor="avatar"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            ユーザーアイコン
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {fileError && (
            <p
              className="mt-1 text-sm text-red-600"
              data-testid="file-error"
              role="alert"
              aria-live="polite"
            >
              {fileError}
            </p>
          )}
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="プレビュー"
                data-testid="image-preview"
                className="w-20 h-20 object-cover rounded-md border border-gray-300"
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 font-medium rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isSubmitting
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
            }`}
          >
            {isSubmitting ? "登録中..." : "新規登録"}
          </button>
        </div>

        {/* エラーメッセージ表示 */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600" data-testid="api-error">
              {apiError}
            </p>
          </div>
        )}

        {/* 成功メッセージ表示 */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">新規登録が完了しました！</p>
          </div>
        )}

        {/* ログイン画面へのリンク */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちの方は{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ログイン画面へ
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

export default SignupPage;
