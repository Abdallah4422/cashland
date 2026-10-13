import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './cashland/SplashScreen';
import OnboardingScreen from './cashland/OnboardingScreen';
import RegistrationFlow from './cashland/RegistrationFlow';
import MainApp from './cashland/MainApp';
import { BackendProvider, useBackendContext } from './cashland/BackendContext';
import { loadSession } from './cashland/useUserSession';

// Cashland — Nigerian-first onchain payment wallet
type AppState = 'splash' | 'onboarding' | 'registration' | 'app';

function getInitialState(): AppState {
  // Check localStorage session OR backend token
  const session = loadSession();
  const token = localStorage.getItem('cashland_token_v1');
  return session || token ? 'app' : 'splash';
}

function AppInner() {
  const backend = useBackendContext();
  const [appState, setAppState] = useState<AppState>(getInitialState);

  const handleSignOut = async () => {
    await backend.logout();
    setAppState('onboarding');
  };

  return (
    <div className="min-h-dvh bg-[#F4FAF7] max-w-md mx-auto relative overflow-hidden">
      {/* Backend status indicator (dev only) */}
      {backend.status === 'offline' && (
        <div className="fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto">
          <div className="bg-amber-500 text-white text-xs text-center py-1 px-3 font-medium">
            Prototype mode — backend offline
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {appState === 'splash' && (
          <motion.div key="splash" className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <SplashScreen onDone={() => setAppState('onboarding')} />
          </motion.div>
        )}

        {appState === 'onboarding' && (
          <motion.div
            key="onboarding"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OnboardingScreen
              onGetStarted={() => setAppState('registration')}
              onLogin={() => setAppState('registration')}
            />
          </motion.div>
        )}

        {appState === 'registration' && (
          <motion.div
            key="registration"
            className="absolute inset-0"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <RegistrationFlow
              onComplete={() => setAppState('app')}
              backend={backend}
            />
          </motion.div>
        )}

        {appState === 'app' && (
          <motion.div
            key="app"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <MainApp
              onSignOut={() => { void handleSignOut(); }}
              backend={backend}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BackendProvider>
      <AppInner />
    </BackendProvider>
  );
}
