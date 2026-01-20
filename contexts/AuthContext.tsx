// AuthContext.tsx - Authentication State Management
// Place in: src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  provider: 'google' | 'phone' | 'email';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// =============================================================================
// UserMenu.tsx - User Profile Menu Component
// Place in: src/components/UserMenu.tsx
import React, { useState } from 'react';
import { User, LogOut, Settings, Heart, FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-sm font-bold text-white">{user.name}</div>
          <div className="text-xs text-gray-400">{user.email || user.phone}</div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="text-xs text-gray-400 mt-1">{user.email || user.phone}</div>
              <div className="text-xs text-blue-400 mt-1 capitalize">
                Signed in with {user.provider}
              </div>
            </div>

            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <User size={16} className="text-gray-400" />
                <span className="text-sm text-white">Profile</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <Heart size={16} className="text-gray-400" />
                <span className="text-sm text-white">Saved Properties</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <FileText size={16} className="text-gray-400" />
                <span className="text-sm text-white">My Reports</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                <Settings size={16} className="text-gray-400" />
                <span className="text-sm text-white">Settings</span>
              </button>
            </div>

            <div className="p-2 border-t border-white/10">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-left group"
              >
                <LogOut size={16} className="text-gray-400 group-hover:text-red-400" />
                <span className="text-sm text-white group-hover:text-red-400">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// =============================================================================
// App.tsx Integration Example
// Update your main App.tsx file

/*
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import { UserMenu } from './components/UserMenu';

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="app">
      {/* Header with Auth 
      <header className="flex justify-between items-center p-4">
        <div>Your Logo</div>
        
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all"
          >
            Sign In
          </button>
        )}
      </header>

      {/* Auth Modal 
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user) => {
          login(user);
          setShowAuthModal(false);
        }}
      />

      {/* Your app content 
      <main>
        {isAuthenticated ? (
          <YourDashboards />
        ) : (
          <LandingPage onSignIn={() => setShowAuthModal(true)} />
        )}
      </main>
    </div>
  );
}

export default App;
*/
