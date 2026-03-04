import Sidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <AdminHeader />
                <div className="p-6 md:p-8 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
