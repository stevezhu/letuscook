import { ReactNode } from 'react';

export type FallbackProps = {
  title: string;
  description: string;
  icon: ReactNode;
  children?: ReactNode;
};

export function Fallback({
  title,
  description,
  icon,
  children,
}: FallbackProps) {
  return (
    <div className="flex size-full flex-col items-center justify-center p-6">
      <div className="mx-auto max-w-md space-y-6 text-center">
        {icon}

        <div className="space-y-2">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
