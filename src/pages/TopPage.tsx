import { Link } from "react-router-dom";

function TopPage() {
  return (
    <div>
      <h1>TopPage</h1>
      <div className="flex gap-4 justify-center mt-10 max-w-[900px] mx-auto">
        <Link to="/signup" className="p-1 border border-gray-300 rounded-md">
          サインアップ
        </Link>
        <Link to="/login" className="p-1 border border-gray-300 rounded-md">
          ログイン
        </Link>
        <Link to="/user/edit" className="p-1 border border-gray-300 rounded-md">
          ユーザー編集
        </Link>
        <Link to="/list" className="p-1 border border-gray-300 rounded-md">
          リスト
        </Link>
        <Link to="/post" className="p-1 border border-gray-300 rounded-md">
          書籍レビュー投稿
        </Link>
      </div>
    </div>
  );
}

export default TopPage;
