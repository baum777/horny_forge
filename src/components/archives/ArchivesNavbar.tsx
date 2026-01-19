import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Upload, User, LogOut, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArchivesLoginModal } from './ArchivesLoginModal';
import { UploadArtifactModal } from './UploadArtifactModal';
import { useCopy } from '@/lib/theme/copy';

const X_COMMUNITY_URL =
  import.meta.env.NEXT_PUBLIC_X_COMMUNITY_URL ||
  import.meta.env.VITE_X_COMMUNITY_URL ||
  'https://x.com/i/communities/2009563480613949770';
const TOKEN_SYMBOL =
  import.meta.env.NEXT_PUBLIC_TOKEN_SYMBOL || import.meta.env.VITE_TOKEN_SYMBOL || 'TOKEN';

const navLinks = [
  { href: '/archives', labelKey: 'archives.nav.archives', external: false },
  { href: X_COMMUNITY_URL, labelKey: 'archives.nav.community', external: true },
];

export function ArchivesNavbar() {
  const t = useCopy();
  const location = useLocation();
  const navigate = useNavigate();
  const { archivesUser, isAuthenticated, signOut, loading } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for styling
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInfuseClick = () => {
    if (isAuthenticated) {
      setShowUpload(true);
    } else {
      setShowLogin(true);
    }
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/archives');
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    navigate('/archives');
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/95 backdrop-blur-lg border-b border-border shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/archives" className="flex items-center gap-2 group">
              <span className="text-xl font-bold text-gradient">${TOKEN_SYMBOL}</span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors hidden sm:inline">
                {t('archives.nav.archives')}
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(link.labelKey)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === link.href || location.pathname.startsWith(link.href + '/')
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t(link.labelKey)}
                  </Link>
                )
              ))}

              {/* Profile Link - only when logged in */}
              {isAuthenticated && (
                <Link
                  to="/profile"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('archives.nav.profile')}
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Infuse Button */}
              <Button
                onClick={handleInfuseClick}
                variant="gradient"
                size="sm"
                className="hidden sm:flex gap-2"
              >
                <Upload className="w-4 h-4" />
                {t('archives.nav.infuse')}
              </Button>

              {/* User State */}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : isAuthenticated && archivesUser ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {archivesUser.avatar ? (
                      <img
                        src={archivesUser.avatar}
                        alt={archivesUser.handle}
                        className="w-6 h-6 rounded-full object-cover ring-2 ring-primary/20"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-destructive" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {archivesUser.handle}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title={t('archives.nav.logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowLogin(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  {t('archives.nav.login')}
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 text-foreground"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border"
            >
              <div className="container mx-auto px-4 py-4 space-y-4">
                {navLinks.map((link) => (
                  link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 py-2 text-muted-foreground"
                    >
                    {t(link.labelKey)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`block py-2 font-medium ${
                        location.pathname === link.href
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {t(link.labelKey)}
                    </Link>
                  )
                ))}
                
                {isAuthenticated && (
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 py-2 text-muted-foreground"
                  >
                    <User className="w-4 h-4" />
                    {t('archives.nav.profile')}
                  </Link>
                )}

                <Button
                  onClick={handleInfuseClick}
                  variant="gradient"
                  className="w-full gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {t('archives.nav.infuseLong')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Modals */}
      <ArchivesLoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
        onSuccess={handleLoginSuccess}
      />
      <UploadArtifactModal isOpen={showUpload} onClose={() => setShowUpload(false)} />
    </>
  );
}
