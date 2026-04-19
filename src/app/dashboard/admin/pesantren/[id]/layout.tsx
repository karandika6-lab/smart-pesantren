// This layout file purely exists to satisfy Next.js static export generator
// because the main page.tsx uses "use client" which forbids exporting generateStaticParams.
export async function generateStaticParams() {
    return [{ id: 'dummy' }];
}

export default function PesantrenMonitoringLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
