import { useState } from "react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 入力内容をコンソールに出力
    console.log("ログイン情報:", { email, password });
    alert(`ログイン情報\nメールアドレス: ${email}\nパスワード: ${password}`);
  };

  return (
    <div className="max-w-md mx-auto p-5">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="example@email.com"
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="password"
            className="block mb-1 text-sm font-medium text-gray-700 "
          >
            パスワード
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="パスワードを入力"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-[#000] text-white font-medium rounded-md text-base cursor-pointer hover:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500  transition-colors"
        >
          ログイン
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
