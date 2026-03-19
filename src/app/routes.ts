import { createBrowserRouter } from "react-router";
import Home from "../pages/home";
import Learning from "../pages/learning";
import Results from "../pages/results";
import CreateFlashcard from "../components/create-flashcard";
import ManageCards from '../pages/manage';

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/create",
    Component: CreateFlashcard,
  },
  {
    path: "/learn/:mode",
    Component: Learning,
  },
  {
    path: "/results",
    Component: Results,
  },
  {
    path: "/manage",
    Component: ManageCards,
  },
]);
