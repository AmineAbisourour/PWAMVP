import { useState, useEffect } from 'react';
import { getAllHOAs, createHOA, getHOAById } from './db/database';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingPage } from './components/LandingPage';
import { CreateHOAForm } from './components/CreateHOAForm';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';

function App() {
  const [currentView, setCurrentView] = useState('loading'); // 'loading', 'landing', 'create', 'dashboard', 'transactions'
  const [currentHOA, setCurrentHOA] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if HOA exists on mount
  useEffect(() => {
    async function checkForHOA() {
      try {
        const hoas = await getAllHOAs();
        if (hoas.length > 0) {
          // HOA exists, go to dashboard
          setCurrentHOA(hoas[0]); // Use the first HOA
          setCurrentView('dashboard');
        } else {
          // No HOA, show landing page
          setCurrentView('landing');
        }
      } catch (error) {
        console.error('Error checking for HOA:', error);
        setCurrentView('landing');
      } finally {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />

      {currentView === 'landing' && (
        <LandingPage onCreateHOA={handleCreateHOAClick} />
      )}

      {currentView === 'create' && (
        <CreateHOAForm
          onCancel={handleCancelCreate}
          onCreate={handleHOACreate}
        />
      )}

      {currentView === 'dashboard' && currentHOA && (
        <Dashboard hoa={currentHOA} onViewAllTransactions={handleViewAllTransactions} />
      )}

      {currentView === 'transactions' && currentHOA && (
        <TransactionsPage hoa={currentHOA} onBack={handleBackToDashboard} />
      )}
    </>
  );
}

export default App;
