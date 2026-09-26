import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (name: string, email: string) => void;
  onShowToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('Beatrice Moreau');
  const [email, setEmail] = useState('b.moreau@sorbonne.theology.edu');
  const [passphrase, setPassphrase] = useState('••••••••••••');
  const [covenantAccepted, setCovenantAccepted] = useState(true);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('Patristics');

  if (!isOpen) return null;

  const disciplines = ['Patristics', 'Eastern Orthodoxy', 'Monasticism', 'Scholasticism', 'Reformed'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!covenantAccepted && authMode === 'signup') {
      onShowToast('Please agree to the community reading guidelines.');
      return;
    }
    onAuthenticated(name, email);
    onShowToast(authMode === 'signin' ? `Signed in as ${name}` : `Welcome, ${name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-theme-surface rounded-2xl p-6 shadow-2xl border border-theme max-h-[92vh] overflow-y-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between pb-3 border-b border-theme">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-main text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <BookOpen className="w-4 h-4 text-theme-accent" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-theme-main">{isAmharic ? 'ሶፊያ' : 'Sophia'}</h2>
              <span className="text-[11px] text-theme-muted block -mt-0.5">
                {isAmharic ? 'የአባላት መግቢያ' : 'Member Portal'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isAmharic ? 'ዝጋ' : 'Close'}
            title={isAmharic ? 'ዝጋ' : 'Close'}
            className="w-8 h-8 rounded-full flex items-center justify-center text-theme-subtle hover:text-theme-main hover:bg-theme-subtle cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-theme-subtle rounded-xl p-1 my-4 border border-theme">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-label-md uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              authMode === 'signin' ? 'bg-theme-surface text-theme-main shadow-xs' : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            {isAmharic ? 'ግባ' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-label-md uppercase tracking-wider font-semibold transition-all cursor-pointer ${
              authMode === 'signup' ? 'bg-theme-surface text-theme-main shadow-xs' : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            {isAmharic ? 'መለያ ፍጠር' : 'Create Account'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'signup' && (
            <div>
              <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beatrice Moreau"
                className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
              {isAmharic ? 'ኢሜይል አድራሻ' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
              {isAmharic ? 'የይለፍ ቃል' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-subtle hover:text-theme-main cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {authMode === 'signup' && (
            <div>
              <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1.5">
                {isAmharic ? 'የጥናት መስክ' : 'Primary Reading Interest'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {disciplines.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDiscipline(d)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                      selectedDiscipline === d
                        ? 'bg-theme-accent text-white font-semibold'
                        : 'bg-theme-subtle text-theme-muted hover:bg-theme-muted'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {authMode === 'signup' && (
            <label className="flex items-start gap-2 pt-1 text-xs text-theme-muted cursor-pointer">
              <input
                type="checkbox"
                checked={covenantAccepted}
                onChange={(e) => setCovenantAccepted(e.target.checked)}
                className="mt-0.5 rounded text-theme-accent focus:ring-theme-accent"
              />
              <span className="leading-snug">
                {isAmharic ? 'የማህበረሰቡን የንባብ እና የውይይት መመሪያዎች ተቀብያለሁ።' : 'I agree to the community reading and discussion guidelines.'}
              </span>
            </label>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-theme-main hover:bg-theme-main/90 text-white font-label-md text-xs uppercase tracking-wider font-semibold transition-colors mt-2 shadow-sm cursor-pointer"
          >
            {authMode === 'signin'
              ? (isAmharic ? 'ወደ ሶፊያ ግባ' : 'Sign In to Sophia')
              : (isAmharic ? 'መለያ ፍጠር' : 'Create Scholarly Account')}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-theme"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-label-md text-theme-subtle">
              {isAmharic ? 'ወይም በዚህ ይቀጥሉ' : 'Or continue with'}
            </span>
            <div className="flex-grow border-t border-theme"></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onAuthenticated('Beatrice Moreau', 'b.moreau@sorbonne.theology.edu');
                onShowToast('Authenticated via Academic Google Workspace');
                onClose();
              }}
              className="py-2 px-3 rounded-lg border border-theme bg-theme-subtle hover:bg-theme-muted text-xs font-semibold text-theme-main flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-red-600">mail</span>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAuthenticated('Beatrice Moreau', 'b.moreau@sorbonne.theology.edu');
                onShowToast('Authenticated via Apple ID');
                onClose();
              }}
              className="py-2 px-3 rounded-lg border border-theme bg-theme-subtle hover:bg-theme-muted text-xs font-semibold text-theme-main flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Apple</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
