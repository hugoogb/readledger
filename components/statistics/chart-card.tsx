type ChartCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <section className={`glass rounded-2xl p-4 sm:p-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}
