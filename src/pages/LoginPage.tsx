import { useForm } from "react-hook-form";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type LoginFormData = {
  email: string;
  password: string;
};

type LoginState = {
  success: boolean;
  error?: string;
  data?: LoginFormData;
};

// ログインボタン
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 px-4 font-medium rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
        pending
          ? "bg-gray-400 text-gray-700 cursor-not-allowed"
          : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
      }`}
    >
      {pending ? "ログイン中..." : "ログイン"}
    </button>
  );
}

function LoginPage() {
  // フォームフィールドをreact-hook-formに登録
  // register()：フォームフィールドをreact-hook-formに登録する関数
  // trigger()：バリデーションを実行する関数
  const {
    register,
    formState: { errors },
    trigger,
  } = useForm<LoginFormData>();

  // Action中にバリデーションを実行
  const loginAction = async (
    _prevState: LoginState, // 前state. 未使用だがlintエラーを防ぐために記載
    formData: FormData,
  ): Promise<LoginState> => {
    // フォームデータを取得
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // バリデーションを実行
    const isEmailValid = await trigger("email");
    const isPasswordValid = await trigger("password");

    if (!isEmailValid) {
      return {
        success: false,
        error: "メールアドレスが不正です",
      };
    }
    if (!isPasswordValid) {
      return {
        success: false,
        error: "パスワードが不正です",
      };
    }

    // ログインっぽい動きにしとく。pendingも確認できるように。
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // ここで実際のAPI呼び出しを行う
      console.log("ログイン処理:", { email, password });

      // 成功時の処理
      return {
        success: true,
        data: { email, password },
      };
    } catch {
      return {
        success: false,
        error: "ログインに失敗しました",
      };
    }
  };

  // ログイン状態を管理
  const [loginState, dispatch] = useActionState(loginAction, {
    success: false,
  });

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>

      <form action={dispatch}>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            メールアドレス
          </label>
          <input
            id="email"
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
            <p className="mt-1 text-sm text-red-600" data-testid="email-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="mb-5">
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
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <SubmitButton />
        </div>

        {/* エラーメッセージ表示 */}
        {loginState.error && (
          <div className="mb-4 p-3 bg-red-50">
            <p className="text-sm text-red-600">{loginState.error}</p>
          </div>
        )}

        {/* 成功メッセージ表示 */}
        {loginState.success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">ログインに成功しました！</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default LoginPage;
