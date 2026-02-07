import AdminLayout from '@/components/layout/AdminLayout'

export default function KYCLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AdminLayout>{children}</AdminLayout>
}
