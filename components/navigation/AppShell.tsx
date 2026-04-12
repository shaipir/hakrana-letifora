import TopBar from '@/components/navigation/TopBar';
import BottomNav from '@/components/navigation/BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="flex-1 pt-14 pb-16 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
