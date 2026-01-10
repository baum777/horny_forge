import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Upload, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArchivesLoginModal } from './ArchivesLoginModal';
import { UploadArtifactModal } from './UploadArtifactModal';

const X_COMMUNITY_URL = 'https://x.com/i/communities/2009563480613949770';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/archives', label: 'Archives' },
  { href: '/interact', label: 'Interact' },
  { href: X_COMMUNITY_URL, label: 'Community', external: true },
];

export function ArchivesNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { archivesUser, isAuthenticated, signOut, loading } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for styling
  useState(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const handleInfuseClick = () => {
    if (isAuthenticated) {
      setShowUpload(true);
    } else {
      setShowLogin(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/archives');
  };

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-background/90 backdrop-blur-lg border-b border-border' : ''
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/archives" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gradient">$HORNY</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">ARCHIVES</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => 
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`text-sm font-medium transition-colors ${
                      location.pathname === link.href
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
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
                INFUSE
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
                        className="w-6 h-6 rounded-full object-cover"
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
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowLogin(true)}
                  variant="outline"
                  size="sm"
                >
                  Login with X
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
                {navLinks.map((link) => 
                  link.external ? (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className="block py-2 font-medium text-muted-foreground"
                    >
                      {link.label}
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
                      {link.label}
                    </Link>
                  )
                )}
                
                {isAuthenticated && (
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 py-2 text-muted-foreground"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                )}

                <Button
                  onClick={() => {
                    setIsOpen(false);
                    handleInfuseClick();
                  }}
                  variant="gradient"
                  className="w-full gap-2"
                >
                  <Upload className="w-4 h-4" />
                  INFUSE THE ARCHIVES
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Modals */}
      <ArchivesLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <UploadArtifactModal isOpen={showUpload} onClose={() => setShowUpload(false)} />
    </>
  );
}
