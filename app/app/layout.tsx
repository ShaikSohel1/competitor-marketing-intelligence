"use client"
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { GradientMesh } from '@/components/GradientMesh'
import { useAlerts } from '@/hooks/useAlerts'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { refresh } = useAlerts();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pathname = usePathname();
  const isOnboarding = pathname === '/app/onboarding';

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen bg-canvas text-ink">
        <GradientMesh />
        <div className="relative z-10 flex min-h-screen">
          {!isOnboarding && (
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          )}
          <div className={`flex-1 ${isOnboarding ? '' : 'lg:pl-64'}`}>
            {!isOnboarding && (
              <Topbar onMenuClick={() => setSidebarOpen(true)} />
            )}
            <main className={`mx-auto max-w-7xl px-4 py-12 ${isOnboarding ? 'lg:py-12' : 'lg:px-8 lg:py-16'}`}>
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
