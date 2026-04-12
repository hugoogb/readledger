type FormSectionProps = {
  title?: string;
  description?: string;
  columns?: 1 | 2;
  children: React.ReactNode;
};

export function FormSection({
  title,
  description,
  columns = 1,
  children,
}: FormSectionProps) {
  return (
    <div>
      {(title || description) && (
        <div className="mb-3">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {description && (
            <p className="text-xs text-foreground-muted mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={
          columns === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"
        }
      >
        {children}
      </div>
    </div>
  );
}
