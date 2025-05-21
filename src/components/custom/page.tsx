
type PageProps = {
    children: React.ReactNode;
}

export default function Page({ children }: PageProps) {
    return <main className="p-8 w-full">
        {children}
    </main>
}

