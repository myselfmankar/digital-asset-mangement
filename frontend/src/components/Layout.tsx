import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useState } from 'react';
import { BottomNavbar } from './BottomNavbar';

export function Layout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-neutral-950 border-neutral-800">
          <Sidebar onLinkClick={() => setIsMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Top Bar (adjusted for mobile toggle) */}
      <TopBar 
        onMenuClick={() => setIsMobileSidebarOpen(true)} 
        showMenuButton={true}
      />

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navbar for Mobile */}
      <BottomNavbar />
    </div>
  );
}
