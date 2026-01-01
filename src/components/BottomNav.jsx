import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: "list_alt", label: "List", path: "/lister" },
    { icon: "shopping_cart", label: "Shop", path: "/shopper" },
    { icon: "receipt_long", label: "Summary", path: "/summary-history" }
  ];

  return (
    <div className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className={location.pathname.startsWith(tab.path) ? "active" : ""}
        >
          <span className="material-symbols-outlined">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
