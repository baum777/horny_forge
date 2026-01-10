import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUser, type User as UserType } from '@/lib/storage';
import LoginModal from '@/components/modals/LoginModal';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/interact', label: 'Interact' },
  { href: '/#lore', label: 'Lore' },
  { href: '/#fomo', label: 'FOMO' },
  { href: '/#badges', label: 'Badges' },
];

export default function Navbar() {
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

  const scrollToSection = (href: string) => {
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/90 backdrop-blur-md border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-black text-gradient">$HORNY</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => {
                    if (link.href.startsWith('/#')) {
                      scrollToSection(link.href);
                    }
                  }}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {link.href.startsWith('/#') ? (
                    link.label
                  ) : (
                    <Link to={link.href}>{link.label}</Link>
                  )}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">@{user.handle}</span>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowLogin(true)}>
                  Login with X
                </Button>
              )}
              <Button
                variant="gradient"
                size="sm"
                onClick={() => {
                  if (location.pathname === '/') {
                    const el = document.getElementById('interact-preview');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.location.href = '/interact';
                  }
                }}
              >
                GET HORNY
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/95 backdrop-blur-md border-b border-border"
            >
              <div className="px-4 py-4 space-y-3">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => {
                      if (link.href.startsWith('/#')) {
                        scrollToSection(link.href);
                      } else {
                        setIsOpen(false);
                      }
                    }}
                    className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.href.startsWith('/#') ? (
                      link.label
                    ) : (
                      <Link to={link.href}>{link.label}</Link>
                    )}
                  </button>
                ))}
                <div className="pt-4 border-t border-border space-y-3">
                  {user ? (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-sm">@{user.handle}</span>
                    </div>
                  ) : (
                    <Button variant="ghost" className="w-full" onClick={() => setShowLogin(true)}>
                      Login with X
                    </Button>
                  )}
                  <Button variant="gradient" className="w-full">
                    GET HORNY
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
