import { Label } from "./label";

type FormFieldProps = {
  label: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function FormField({ label, error, htmlFor, required, children }: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
