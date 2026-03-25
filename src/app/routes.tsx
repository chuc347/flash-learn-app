import { createBrowserRouter } from "react-router";
import Home from "../pages/home";
import Learning from "../pages/learning";
import Results from "../pages/results";
import CreateFlashcard from "../components/create-flashcard";
import ManageCards from '../pages/manage';
import Login from '../pages/login';
import ProtectedRoute from "../components/ProtectedRoute";

// --- THÊM IMPORT 2 TRANG QUÊN MẬT KHẨU ---
import ForgotPassword from "../pages/forgot-password";
import UpdatePassword from "../pages/update-password";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login, // Trang Login là ngoại lệ: Mở cửa tự do cho tất cả mọi người
  },
  
  // --- THÊM 2 ROUTE NÀY: Mở cửa tự do giống hệt Login ---
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/update-password",
    element: <UpdatePassword />,
  },
  // -------------------------------------------------------

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