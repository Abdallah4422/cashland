import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './cashland/SplashScreen';
import OnboardingScreen from './cashland/OnboardingScreen';
import RegistrationFlow from './cashland/RegistrationFlow';
import MainApp from './cashland/MainApp';
import { BackendProvider, useBackendContext } from './cashland/BackendContext';

// Cashland — Nigerian-first onchain payment wallet
// 'splash-pending' = splash shown, backend still checking
// 'splash-done'    = splash done, waiting for backend result
type AppPhase = 'splash' | 'onboarding' | 'registration' | 'app';

function AppInner() {
  const backend = useBackendContext();
  const [splashDone, setSplashDone] = useState(false);
  // Explicit override only used for registration→app and sign-out flows
  const [forcePhase, setForcePhase] = useState<AppPhase | null>(null);

  // Derive current phase from state — no setState inside effects
  const appPhase: AppPhase = (() => {
    if (forcePhase) return forcePhase;
    if (!splashDone) return 'splash';
    if (backend.status === 'checking') return 'splash'; // hold on splash while backend boots
    if (backend.user) return 'app';
    return 'onboarding';
  })();

  const handleSignOut = async () => {
    await backend.logout();
    setForcePhase('onboarding');
  };

  return (
    <div className="min-h-dvh bg-[#F4FAF7] max-w-md mx-auto relative overflow-hidden">
      {/* Backend status indicator */}
      {backend.status === 'offline' && (
        <div className="fixed top-0 left-0 right-0 z-[100] max-w-md mx-auto">
          <div className="bg-amber-500 text-white text-xs text-center py-1 px-3 font-medium">
            Prototype mode — backend offline
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {appPhase === 'splash' && (
          <motion.div key="splash" className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <SplashScreen onDone={() => setSplashDone(true)} />
          </motion.div>
        )}

        {appPhase === 'onboarding' && (
          <motion.div
            key="onboarding"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OnboardingScreen
              onGetStarted={() => setForcePhase('registration')}
              onLogin={() => setForcePhase('registration')}
            />
          </motion.div>
        )}

        {appPhase === 'registration' && (
          <motion.div
            key="registration"
            className="absolute inset-0"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <RegistrationFlow
              onComplete={() => setForcePhase('app')}
              backend={backend}
            />
          </motion.div>
        )}

        {appPhase === 'app' && (
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
