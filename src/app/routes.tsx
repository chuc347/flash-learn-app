import { createBrowserRouter } from "react-router";
import Home from "../pages/home";
import Learning from "../pages/learning";
import Results from "../pages/results";
import CreateFlashcard from "../components/create-flashcard";
import ManageCards from '../pages/manage';
import Login from '../pages/login';
// 1. Nhớ Import "Anh bảo vệ" vào đây nhé
import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login, // Trang Login là ngoại lệ: Mở cửa tự do cho tất cả mọi người
  },
  {
    path: "/",
    element: <ProtectedRoute><Home /></ProtectedRoute>, // Bọc bảo vệ vòng ngoài
  },
  {
    path: "/create",
    element: <ProtectedRoute><CreateFlashcard /></ProtectedRoute>,
  },
  {
    path: "/learn/:mode",
    element: <ProtectedRoute><Learning /></ProtectedRoute>,
  },
  {
    path: "/results",
    element: <ProtectedRoute><Results /></ProtectedRoute>,
  },
  {
    path: "/manage",
    element: <ProtectedRoute><ManageCards /></ProtectedRoute>,
  },
]);