"use client";

import * as React from "react";
import { FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

export { FormProvider, zodResolver };
export { cn };

function Form({
  children,
  className,
  onSubmit,
}: {
  children: React.ReactNode;
  className?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className={className} onSubmit={onSubmit} noValidate>
      {children}
    </form>
  );
}

function Label({
  required,
  children,
  className,
  ...props
}: Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "required"> & {
  required?: boolean;
}) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: { message?: string };
  required?: boolean;
  children: React.ReactElement;
}) {
  const errorId = React.useId();
  const errorMessageId = `${errorId}-error`;
  const hasError = !!error;

  const child = React.isValidElement(children)
    ? (children as React.ReactElement<Record<string, unknown>>)
    : children;

  const enhancedChild = React.cloneElement(child, {
    "aria-invalid": hasError ? true : undefined,
    "aria-describedby": hasError ? errorMessageId : undefined,
    className: cn(
      (child.props as { className?: string }).className,
      hasError && "border-destructive focus-visible:ring-destructive",
    ),
  });

  return (
    <div className="space-y-2">
      <Label required={required}>{label}</Label>
      {enhancedChild}
      {error && (
        <p
          id={errorMessageId}
          className="text-sm text-destructive"
          role="alert"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}

function FormButton({
  children,
  loading,
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2",
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Form, Label, FormField, FormButton, Input };
