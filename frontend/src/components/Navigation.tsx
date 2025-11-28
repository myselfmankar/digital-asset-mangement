import { Link, useLocation } from 'react-router-dom';
import { Image as ImageIcon, Search, Upload, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { icon: ImageIcon, label: 'Gallery', href: '/' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Upload, label: 'Upload', href: '/upload' },
    { icon: BarChart3, label: 'Stats', href: '/stats' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
              <ImageIcon className="h-5 w-5" />
              <span className="hidden sm:inline">PhotoVault</span>
            </Link>

            <nav className="hidden sm:flex gap-1">
              {navItems.map(({ icon: Icon, label, href }) => (
                <Link key={href} to={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2',
                      location.pathname === href
                        ? 'bg-neutral-800 text-neutral-50'
                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex sm:hidden gap-1">
            {navItems.map(({ icon: Icon, href }) => (
              <Link key={href} to={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    location.pathname === href
                      ? 'bg-neutral-800 text-neutral-50'
                      : 'text-neutral-400 hover:text-neutral-50 hover:bg-neutral-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
