import { useParams } from "react-router-dom";

function EditPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1>書籍レビュー編集 (ID: {id})</h1>
    </div>
  );
}

export default EditPage;
