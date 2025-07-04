import { Link } from "react-router-dom";

function TopPage() {
  return (
    <div>
      <h1>TopPage</h1>
      <div className="flex gap-4">
        <Link to="/signup">サインアップ</Link>
        <Link to="/login">ログイン</Link>
        <Link to="/user/edit">ユーザー編集</Link>
        <Link to="/list">リスト</Link>
        <Link to="/post">書籍レビュー投稿</Link>
        <Link to="/detail">書籍レビュー詳細</Link>
      </div>
    </div>
  );
}

export default TopPage;
