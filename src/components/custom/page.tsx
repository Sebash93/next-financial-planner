export default function Page({ title, children }) {
    return <main className="p-8 w-full">
        <header className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {title}
        </header>
        <section className="mt-8">
            {children}
        </section>
    </main>
}

