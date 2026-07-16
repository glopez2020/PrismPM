import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padded?: boolean;
}

export function Card({ children, className = "", hover = false, padded = true }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-navy-200 bg-white
        ${padded ? "p-6" : ""}
        ${hover ? "transition-all duration-200 hover:shadow-lg hover:border-navy-300 hover:-translate-y-0.5" : "shadow-sm"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-semibold text-navy-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 flex items-center gap-3 border-t border-navy-100 pt-4 ${className}`}>
      {children}
    </div>
  );
}