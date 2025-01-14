export default function Page({ title, children }) {
    return <main className="p-8">
        <header className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            {title}
        </header>
        <section className="mt-8">
            {children}
        </section>
    </main>
}

