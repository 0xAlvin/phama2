"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog = ({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: DialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setUncontrolledOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  // Create a Context to share the open state and handleOpenChange
  const DialogContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>({
    open: isOpen,
    onOpenChange: handleOpenChange,
  });

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const context = React.useContext(
    React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({
      open: false,
      onOpenChange: () => {},
    })
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        context.onOpenChange(true);
        (children as React.ReactElement<any>).props.onClick?.(e);
      },
      ref,
    });
  }

  return (
    <button
      type="button"
      ref={ref}
      onClick={() => context.onOpenChange(true)}
      {...props}
    >
      {children}
    </button>
  );
});
DialogTrigger.displayName = "DialogTrigger";

const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

const DialogClose: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
  const context = React.useContext(
    React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({
      open: false,
      onOpenChange: () => {},
    })
  );

  return (
    <button
      type="button"
      onClick={() => context.onOpenChange(false)}
      {...props}
    />
  );
};

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(
    React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({
      open: false,
      onOpenChange: () => {},
    })
  );

  if (!context.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <DialogOverlay onClick={() => context.onOpenChange(false)} />
      <div
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
          onClick={() => context.onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
