"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFormContext, Controller, FieldPath, FieldValues } from "react-hook-form";

interface FormProps<TFieldValues extends FieldValues = FieldValues>
  extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>({
  id: "",
});

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control: any;
  render: ({ field, formState }: { field: any; formState: any }) => React.ReactElement;
}

const FormFieldContext = React.createContext<FormFieldContextValue | undefined>(undefined);

const Form = React.forwardRef<HTMLFormElement, FormProps>(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn("space-y-6", className)}
    {...props}
  />
));
Form.displayName = "Form";

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, control, render }: FormFieldProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller
        name={name}
        control={control}
        render={({ field, formState }) => {
          return render({ field, formState });
        }}
      />
    </FormFieldContext.Provider>
  );
};
FormField.displayName = "FormField";

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);

  if (!fieldContext) {
    throw new Error("useFormField must be used within a FormField");
  }

  const { name } = fieldContext;
  const id = itemContext?.id || name;

  return { id, name };
};

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          ref={ref}
          className={cn("space-y-2", className)}
          {...props}
        />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => {
    const { id } = useFormField();

    return (
      <label
        ref={ref}
        htmlFor={id}
        className={cn("form-label", className)}
        {...props}
      />
    );
  }
);
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ ...props }, ref) => {
    const { id } = useFormField();

    return <div ref={ref} id={id} {...props} />;
  }
);
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    const { id } = useFormField();

    return (
      <p
        ref={ref}
        id={`${id}-description`}
        className={cn("form-description", className)}
        {...props}
      />
    );
  }
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, ...props }, ref) => {
    const { id, name } = useFormField();
    
    try {
      const { formState } = useFormContext();
      const fieldState = formState?.errors?.[name];
      const body = fieldState?.message?.toString() || children;

      if (!body) {
        return null;
      }

      return (
        <p
          ref={ref}
          id={`${id}-message`}
          className={cn("form-message", className)}
          {...props}
        >
          {body}
        </p>
      );
    } catch (error) {
      if (children) {
        return (
          <p
            ref={ref}
            id={`${id}-message`}
            className={cn("form-message", className)}
            {...props}
          >
            {children}
          </p>
        );
      }
      return null;
    }
  }
);
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};
