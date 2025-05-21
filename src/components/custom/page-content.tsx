type PageContentProps = {
    children: React.ReactNode;
}

export const PageContent = ({ children }: PageContentProps) => {
    return (
        <section className="mt-8">
            {children}
        </section>
    );
}