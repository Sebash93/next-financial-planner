type PageTitle = {
    children: React.ReactNode;
}

export const PageTitle = ({ children }: PageTitle) => {
    return (
        <header className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            {children}
        </header>
    );
}