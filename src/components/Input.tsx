import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-navy-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            block w-full rounded-lg border px-3 py-2 text-sm text-navy-900
            placeholder:text-navy-400 transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-navy-300 focus:border-indigo-500 focus:ring-indigo-500/20"
            }
            disabled:bg-navy-50 disabled:text-navy-400 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {helper && !error && <p className="text-sm text-navy-500">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";