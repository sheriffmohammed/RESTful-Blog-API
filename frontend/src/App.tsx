import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyPostsPage } from "./pages/MyPostsPage";
import { PostEditorPage } from "./pages/PostEditorPage";
import { PostPage } from "./pages/PostPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UserPostsPage } from "./pages/UserPostsPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/me" element={<MyPostsPage />} />
        <Route path="/posts/new" element={<PostEditorPage mode="create" />} />
        <Route path="/posts/:postId" element={<PostPage />} />
        <Route path="/posts/:postId/edit" element={<PostEditorPage mode="edit" />} />
        <Route path="/users/:userId" element={<UserPostsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
