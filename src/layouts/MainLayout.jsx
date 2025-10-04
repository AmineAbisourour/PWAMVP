import { useState } from "react";
import { Sidebar } from "../components/Sidebar";

export function MainLayout({
  currentView,
  currentHOA,
  onNavigate,
  onUpdate,
  maxWidth,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Map view names to max-width classes
  const viewMaxWidths = {
    dashboard: "max-w-4xl",
    transactions: "max-w-6xl",
    specialAssessments: "max-w-6xl",
    reports: "max-w-6xl",
    settings: "max-w-2xl",
  };

  // Use provided maxWidth or default to view-specific width
  const containerMaxWidth = maxWidth || viewMaxWidths[currentView] || "max-w-6xl";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        hoa={currentHOA}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main Content - with margin-left on desktop to account for fixed sidebar */}
      <div className="flex flex-col md:ml-64">
        {/* Header with hamburger menu */}
        <header className="bg-blue-600 text-white shadow-lg safe-area-inset sticky top-0 z-30">
          <div className="px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 hover:bg-blue-700 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div>
                <p className="text-sm font-medium text-blue-100">{currentHOA.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className={`${containerMaxWidth} mx-auto space-y-6`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
