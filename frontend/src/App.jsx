import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DesignGeneratorPage from "./pages/DesignGeneratorPage";
import CodeAgentPage from "./pages/CodeAgentPage";
import ArtPipelinePage from "./pages/ArtPipelinePage";
import SettingsPage from "./pages/SettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "design",
        element: <DesignGeneratorPage />,
      },
      {
        path: "code",
        element: <CodeAgentPage />,
      },
      {
        path: "art",
        element: <ArtPipelinePage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;