import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import TopPage from "./pages/TopPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import UserEditPage from "./pages/UserEditPage";
import ListPage from "./pages/ListPage";
import PostPage from "./pages/PostPage";
import DetailPage from "./pages/DetailPage";
import EditPage from "./pages/EditPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/user/edit"
            element={
              <ProtectedRoute>
                <UserEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/list"
            element={
              <ProtectedRoute>
                <ListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post"
            element={
              <ProtectedRoute>
                <PostPage />
              </ProtectedRoute>
            }
          />
          <Route path="/detail" element={<DetailPage />} />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <EditPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
