import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { getAllHOAs, createHOA, getHOAById, loadDemoData, clearDemoData } from './db/database';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingPage } from './components/LandingPage';
import { CreateHOAForm } from './components/CreateHOAForm';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { Sidebar } from './components/Sidebar';
import { HOASettings } from './components/HOASettings';
import { Reports } from './components/Reports';
import { SpecialAssessmentsPage } from './components/SpecialAssessmentsPage';
import { SplashScreen } from './components/SplashScreen';

function App() {
  const [currentView, setCurrentView] = useState('loading'); // 'loading', 'landing', 'create', 'dashboard', 'transactions', 'specialAssessments', 'reports', 'settings'
  const [currentHOA, setCurrentHOA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Register service worker for PWA updates
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      // Check for updates when app loads
      if (registration) {
        registration.update();
      }
    },
    onRegisterError(error) {
      console.error('Service worker registration error:', error);
    },
  });

  // Check for user-created HOA on mount with connectivity and update checks
  useEffect(() => {
    async function checkForHOA() {
      try {
        // 1. Check connectivity
        const isOnline = navigator.onLine;
        console.log('Connectivity status:', isOnline ? 'Online' : 'Offline');

        // 2. If online, service worker update check is triggered automatically via onRegistered
        // The service worker will update in the background

        // 3. Check database for NON-DEMO HOAs only (user-created data)
        const allHOAs = await getAllHOAs();
        const userCreatedHOAs = allHOAs.filter(hoa => !hoa.isDemo);

        console.log('Database check - Total HOAs:', allHOAs.length, 'User-created:', userCreatedHOAs.length);

        if (userCreatedHOAs.length > 0) {
          // User-created HOA exists, go to dashboard
          setCurrentHOA(userCreatedHOAs[0]);
          setCurrentView('dashboard');
        } else {
          // No user-created HOA, show landing page
          // (User can create new or load demo from landing page)
          setCurrentView('landing');
        }
      } catch (error) {
        console.error('Error checking for HOA:', error);
        setCurrentView('landing');
      } finally {
        // Remove splash screen after all checks complete
        setLoading(false);
      }
    }

    checkForHOA();
  }, []);

  const handleCreateHOAClick = () => {
    setCurrentView('create');
  };

  const handleCancelCreate = () => {
    setCurrentView('landing');
  };

  const handleHOACreate = async (hoaData) => {
    try {
      // Opening balance is now stored directly in the HOA record
      const id = await createHOA(hoaData);
      const newHOA = await getHOAById(id);
      setCurrentHOA(newHOA);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error creating HOA:', error);
      alert('Failed to create HOA. Please try again.');
    }
  };

  const handleViewAllTransactions = () => {
    setCurrentView('transactions');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleHOAUpdate = (updatedHOA) => {
    setCurrentHOA(updatedHOA);
  };

  const handleLoadDemo = async () => {
    try {
      setLoading(true);
      const id = await loadDemoData();
      const demoHOA = await getHOAById(id);
      setCurrentHOA(demoHOA);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error loading demo data:', error);
      alert('Failed to load demo data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExitDemo = async () => {
    try {
      setLoading(true);
      await clearDemoData();
      setCurrentHOA(null);
      setCurrentView('landing');
    } catch (error) {
      console.error('Error exiting demo mode:', error);
      alert('Failed to exit demo mode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  // Views that don't need sidebar
  const isAuthView = ['dashboard', 'transactions', 'specialAssessments', 'reports', 'settings'].includes(currentView);

  return (
    <>
      <OfflineIndicator />

      {currentView === 'landing' && (
        <LandingPage onCreateHOA={handleCreateHOAClick} onLoadDemo={handleLoadDemo} />
      )}

      {currentView === 'create' && (
        <CreateHOAForm
          onCancel={handleCancelCreate}
          onCreate={handleHOACreate}
        />
      )}

      {isAuthView && currentHOA && (
        <div className="min-h-screen bg-gray-50">
          {/* Sidebar */}
          <Sidebar
            currentView={currentView}
            onNavigate={handleNavigate}
            hoa={currentHOA}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
          />

          {/* Main Content - with margin-left on desktop to account for fixed sidebar */}
          <div className="flex flex-col min-h-screen md:ml-64">
            {/* Header with hamburger menu */}
            <header className="bg-blue-600 text-white shadow-lg safe-area-inset sticky top-0 z-30">
              <div className="px-4 py-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 hover:bg-blue-700 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-xl font-bold">
                      {currentView === 'dashboard' && 'Overview'}
                      {currentView === 'transactions' && 'All Transactions'}
                      {currentView === 'specialAssessments' && 'Special Assessments'}
                      {currentView === 'reports' && 'Financial Reports'}
                      {currentView === 'settings' && 'HOA Settings'}
                    </h1>
                    <p className="text-blue-100 text-sm">{currentHOA.name}</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 md:p-6">
              {currentView === 'dashboard' && (
                <Dashboard hoa={currentHOA} onViewAllTransactions={handleViewAllTransactions} onExitDemo={handleExitDemo} />
              )}

              {currentView === 'transactions' && (
                <TransactionsPage hoa={currentHOA} onBack={handleBackToDashboard} />
              )}

              {currentView === 'specialAssessments' && (
                <SpecialAssessmentsPage hoa={currentHOA} />
              )}

              {currentView === 'reports' && (
                <Reports hoa={currentHOA} />
              )}

              {currentView === 'settings' && (
                <HOASettings hoa={currentHOA} onUpdate={handleHOAUpdate} />
              )}
            </main>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
