import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CreditCard, Activity, BarChart3, User } from 'lucide-react';
import HomeScreen from './HomeScreen';
import PayScreen from './PayScreen';
import ActivityScreen from './ActivityScreen';
import AssetsScreen from './AssetsScreen';
import MeScreen from './MeScreen';
import SendMoneyFlow from './SendMoneyFlow';
import ReceiveScreen from './ReceiveScreen';
import AddMoneyScreen from './AddMoneyScreen';
import WithdrawScreen from './WithdrawScreen';
import BillsScreen from './BillsScreen';
import InviteScreen from './InviteScreen';
import TierScreen from './TierScreen';
import USSDScreen from './USSDScreen';
import NotificationDrawer from './NotificationDrawer';
import ConsentModal, { type ConsentRequest } from './ConsentModal';
import { pushDepositNotification, addNotification } from './useNotifications';
import type { BackendState, BackendActions } from './useBackend';

type Tab = 'home' | 'pay' | 'activity' | 'assets' | 'me';

const tabs = [
  { id: 'home' as Tab, label: 'Home', icon: Home },
  { id: 'pay' as Tab, label: 'Pay', icon: CreditCard },
  { id: 'activity' as Tab, label: 'Activity', icon: Activity },
  { id: 'assets' as Tab, label: 'Assets', icon: BarChart3 },
  { id: 'me' as Tab, label: 'Me', icon: User },
];

export default function MainApp({ onSignOut, backend }: { onSignOut?: () => void; backend?: BackendState & BackendActions }) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showBills, setShowBills] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showTier, setShowTier] = useState(false);
  const [showUSSD, setShowUSSD] = useState(false);
  const [consentRequest, setConsentRequest] = useState<ConsentRequest | null>(null);
  const [consentCallback, setConsentCallback] = useState<(() => void) | null>(null);

  const requestConsent = (req: ConsentRequest, onApproved: () => void) => {
    setConsentRequest(req);
    setConsentCallback(() => onApproved);
  };


  const handleDeposited = () => {
    setShowAddMoney(false);
    pushDepositNotification();
  };

  const handleWithdrawn = (ngnAmount: number) => {
    addNotification({
      type: 'sent',
      title: 'Withdrawal successful',
      body: `${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(ngnAmount)} sent to your bank account.`,
    });
  };

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #F4FAF7 0%, #EDFAF4 50%, #F4FAF7 100%)' }}
    >
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '0%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,107,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '-5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,108,246,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-md mx-auto overflow-y-auto" style={{ height: 'calc(100dvh - 72px)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'home' && (
              <HomeScreen
                onSend={() => setShowSend(true)}
                onReceive={() => setShowReceive(true)}
                onAddMoney={() => requestConsent({
                  scopes: ['account_info', 'payment_initiation'],
                  purpose: 'Fund your Cashland wallet',
                  purposeDescription: 'To add money, Cashland needs to read your account and initiate the inbound transfer on your behalf.',
                  durationDays: 1,
                  institution: 'Your selected bank',
                }, () => setShowAddMoney(true))}
                onWithdraw={() => setShowWithdraw(true)}
                onBills={() => setShowBills(true)}
                onInvite={() => setShowInvite(true)}
                onOpenNotifications={() => setShowNotifications(true)}
                liveBalance={backend?.balance?.ngn.naira}
                userName={backend?.user ? `${backend.user.firstName} ${backend.user.lastName}` : undefined}
              />
            )}
            {activeTab === 'pay' && <PayScreen onClose={() => setActiveTab('home')} onOpenSend={() => setShowSend(true)} onOpenUSSD={() => setShowUSSD(true)} />}
            {activeTab === 'activity' && <ActivityScreen liveTransactions={backend?.transactions} />}
            {activeTab === 'assets' && <AssetsScreen liveUsdcBalance={backend?.balance?.usdc.usdc} />}
            {activeTab === 'me' && (
              <MeScreen
                onOpenTier={() => setShowTier(true)}
                onSignOut={onSignOut}
                user={backend?.user ?? undefined}
                kycTier={backend?.user?.kycTier}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-md mx-auto flex items-stretch" style={{ height: 72 }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                style={{ minHeight: 44 }}
              >
                <div className="relative">
                  {active && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute"
                      style={{ background: 'rgba(0,168,107,0.12)', borderRadius: 10, top: -6, bottom: -6, left: -10, right: -10 }}
                    />
                  )}
                  <Icon
                    size={22}
                    className="relative"
                    style={{ color: active ? 'var(--accent)' : 'var(--muted)', strokeWidth: active ? 2.2 : 1.8 }}
                  />
                </div>
                <span
                  className="text-xs font-semibold relative"
                  style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification drawer (slides from top) */}
      <NotificationDrawer
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Full-screen overlays */}
      <AnimatePresence>
        {showSend && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 38 }}
          >
            <SendMoneyFlow onClose={() => setShowSend(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceive && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 38 }}
          >
            <ReceiveScreen onClose={() => setShowReceive(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddMoney && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 38 }}
          >
            <AddMoneyScreen
              onClose={() => setShowAddMoney(false)}
              onDeposited={handleDeposited}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWithdraw && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 38 }}>
            <WithdrawScreen onClose={() => setShowWithdraw(false)} onWithdrawn={handleWithdrawn} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUSSD && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 38 }}>
            <USSDScreen onClose={() => setShowUSSD(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTier && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 38 }}>
            <TierScreen onClose={() => setShowTier(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBills && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 38 }}>
            <BillsScreen onClose={() => setShowBills(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInvite && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 38 }}>
            <InviteScreen onClose={() => setShowInvite(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consent modal — shown before any Open Banking / Direct Debit action */}
      {consentRequest && (
        <ConsentModal
          open={!!consentRequest}
          request={consentRequest}
          onApprove={() => {
            setConsentRequest(null);
            consentCallback?.();
            setConsentCallback(null);
          }}
          onDecline={() => {
            setConsentRequest(null);
            setConsentCallback(null);
          }}
        />
      )}
    </div>
  );
}
