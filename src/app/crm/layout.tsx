import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import ModernHeader from "@/components/dashboard/ModernHeader"

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Modern Header */}
      <ModernHeader />
      
      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
