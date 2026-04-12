import { useEffect, useState } from "react";

export const usePageNav = () => {
  const [activePage, setActivePage] = useState(
    window.location.hash === "#badges" ? "badges" : "dashboard"
  );

  useEffect(() => {
    const syncPage = () => {
      setActivePage(window.location.hash === "#badges" ? "badges" : "dashboard");
    };

    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);

  const openBadgePage = () => {
    window.location.hash = "badges";
  };

  const openDashboardPage = () => {
    window.location.hash = "";
  };

  return { activePage, openBadgePage, openDashboardPage };
};
