import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import DesignGeneratorPage from "./pages/DesignGeneratorPage";
import ConfigManagerPage from "./pages/ConfigManagerPage";
import CodeAgentPage from "./pages/CodeAgentPage";
import ArtPipelinePage from "./pages/ArtPipelinePage";
import AssetToolsPage from "./pages/AssetToolsPage";
import AudioToolsPage from "./pages/AudioToolsPage";
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
        path: "configs",
        element: <ConfigManagerPage />,
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
        path: "assets",
        element: <AssetToolsPage />,
      },
      {
        path: "audio",
        element: <AudioToolsPage />,
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
