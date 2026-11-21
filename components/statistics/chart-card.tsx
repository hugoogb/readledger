type ChartCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <section className={`rounded-lg border border-border bg-background-secondary p-4 sm:p-6 ${className}`}>
      <h2 className="mb-4 font-serif text-xl font-medium">{title}</h2>
      {children}
    </section>
  );
}
