import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, type User as UserType } from '@/lib/storage';
import LoginModal from '@/components/modals/LoginModal';
import { NavLink } from '../NavLink'; // Ensure this component exists or use Link directly if simple
import { useCopy } from '@/lib/theme/copy';

const LINKS = [
  { href: "/dashboard", labelKey: "nav.dashboard" },
  { href: "/forge", labelKey: "nav.forge" },
  { href: "/gallery", labelKey: "nav.gallery" },
  { href: "/quests", labelKey: "nav.quests" },
];

export default function Navbar() {
  const t = useCopy();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginSuccess = useCallback((newUser: UserType) => {
    setUser(newUser);
    setShowLogin(false);
  }, []);

  // Highlight active link logic
  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md transition-all duration-300 ${scrolled ? 'bg-background/90' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <span className="text-xl font-black tracking-tighter text-white group-hover:text-[#FFE600] transition-colors">
                {t('brand.wordmark')}
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              {LINKS.map((link) => (
                <Link 
                  key={link.href} 
                  to={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href) ? "text-[#FFE600]" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                  <User className="w-4 h-4 text-[#FFE600]" />
                  <span className="text-sm font-medium">@{user.handle}</span>
                </div>
              ) : null}
              
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                className="text-muted-foreground hover:text-[#FFE600] hover:bg-white/5"
              >
                <Link to="/profile">{t('nav.profile')}</Link>
              </Button>
              
              {!user && (
                <Button 
                  size="sm" 
                  onClick={() => setShowLogin(true)}
                  className="bg-white text-black hover:bg-[#FFE600] hover:text-black font-bold border-none"
                >
                  {t('auth.connect')}
                </Button>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
               <button
                className="p-2 text-white"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0B0B0B] border-b border-white/10"
            >
              <div className="flex flex-col p-4 space-y-2">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                      isActive(link.href) 
                        ? "bg-[#FFE600]/10 text-[#FFE600]" 
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
                
                <div className="h-px bg-white/5 my-2" />
                
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-lg font-medium text-muted-foreground hover:text-white"
                >
                  {t('nav.profile')}
                </Link>

                <div className="pt-4">
                  {user ? (
                     <div className="flex items-center gap-2 px-4 py-2">
                      <User className="w-5 h-5 text-[#FFE600]" />
                      <span className="text-white font-medium">@{user.handle}</span>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-[#FFE600] text-black hover:bg-[#FFE600]/90 font-bold"
                      onClick={() => {
                        setIsOpen(false);
                        setShowLogin(true);
                      }}
                    >
                      {t('auth.connect')}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
