import { Link, useLocation } from 'react-router-dom';
import {
  Image as ImageIcon,
  Calendar,
  Map,
  Heart,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavbar() {
  const location = useLocation();

  const navItems = [
    { icon: ImageIcon, label: 'Gallery', href: '/' },
    { icon: Calendar, label: 'Albums', href: '/albums' },
    { icon: Map, label: 'Map', href: '/map' },
    { icon: Heart, label: 'Favorites', href: '/favorites' },
    { icon: Search, label: 'Search', href: '/search' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950 border-t border-neutral-800 lg:hidden">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = location.pathname === href;

          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium',
                isActive ? 'text-white' : 'text-neutral-400 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
