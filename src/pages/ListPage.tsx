import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

function ListPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-4xl mx-auto p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">書籍レビュー一覧</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">ようこそ、{user?.name}さん</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      <div className="text-center text-gray-600 mt-10">
        <p>書籍レビューの一覧がここに表示されます。</p>
      </div>
    </div>
  );
}

export default ListPage;
