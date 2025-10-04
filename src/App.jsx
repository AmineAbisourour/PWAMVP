import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { getAllHOAs, createHOA, getHOAById, loadDemoData, clearDemoData } from './db/database';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingPage } from './components/LandingPage';
import { CreateHOAForm } from './components/CreateHOAForm';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { HOASettings } from './components/HOASettings';
import { Reports } from './components/Reports';
import { SpecialAssessmentsPage } from './components/SpecialAssessmentsPage';
import { MainLayout } from './layouts/MainLayout';

function App() {
  const [currentView, setCurrentView] = useState('loading'); // 'loading', 'landing', 'create', 'dashboard', 'transactions', 'specialAssessments', 'reports', 'settings'
  const [currentHOA, setCurrentHOA] = useState(null);

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
        // Remove HTML splash screen after all checks complete
        const loader = document.getElementById('initial-loader');
        if (loader) {
          loader.style.opacity = '0';
          loader.style.transition = 'opacity 0.3s ease-out';
          setTimeout(() => loader.remove(), 300);
        }
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

  const handleHOAUpdate = (updatedHOA) => {
    setCurrentHOA(updatedHOA);
  };

  const handleLoadDemo = async () => {
    try {
      const id = await loadDemoData();
      const demoHOA = await getHOAById(id);
      setCurrentHOA(demoHOA);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error loading demo data:', error);
      alert('Failed to load demo data. Please try again.');
    }
  };

  const handleExitDemo = async () => {
    try {
      await clearDemoData();
      setCurrentHOA(null);
      setCurrentView('landing');
    } catch (error) {
      console.error('Error exiting demo mode:', error);
      alert('Failed to exit demo mode. Please try again.');
    }
  };

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
        <MainLayout
          currentView={currentView}
          currentHOA={currentHOA}
          onNavigate={handleNavigate}
          onUpdate={handleHOAUpdate}
        >
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
        </MainLayout>
      )}
    </>
  );
}

export default App;
