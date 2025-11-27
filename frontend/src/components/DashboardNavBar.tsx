import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Calendar,
  MessageSquare,
  Store,
  ClipboardList,
  Activity,
  BarChart3,
  Mail,
  Bot,
  Users,
  Palette,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const DASHBOARD_BASE_PATH = "/admin/dashboard";

const DashboardNavBar = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      path: DASHBOARD_BASE_PATH,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Web Analytics",
      path: `${DASHBOARD_BASE_PATH}/web-analytics`,
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      name: "Activity",
      path: `${DASHBOARD_BASE_PATH}/activity`,
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: "CMS",
      path: `${DASHBOARD_BASE_PATH}/cms`,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Inquiries",
      path: `${DASHBOARD_BASE_PATH}/inquiries`,
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      name: "AI Chatbot",
      path: `${DASHBOARD_BASE_PATH}/chatbot`,
      icon: <Bot className="w-5 h-5" />,
    },
    {
      name: "Newsletter",
      path: `${DASHBOARD_BASE_PATH}/newsletter`,
      icon: <Mail className="w-5 h-5" />,
    },
    {
      name: "Staff",
      path: `${DASHBOARD_BASE_PATH}/staff`,
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: "Themes",
      path: `${DASHBOARD_BASE_PATH}/themes`,
      icon: <Palette className="w-5 h-5" />,
    },
  ];

  const isActive = (path: string) => {
    if (path === DASHBOARD_BASE_PATH) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 py-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span className="hidden md:inline-flex">Admin Navigation</span>
            <span className="text-[10px] uppercase tracking-[0.4em] md:hidden">Navigate</span>
          </div>
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Admin sections"
          >
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  role="tab"
                  aria-selected={active}
                  className={`
                    flex min-w-max items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    ${active
                      ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"}
                  `}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavBar;

