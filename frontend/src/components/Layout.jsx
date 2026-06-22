import { Outlet } from "react-router-dom";

import LanguageToggle from "./LanguageToggle";
import Sidebar from "./Sidebar";

function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">
        <div className="topbar">
          <LanguageToggle />
        </div>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
