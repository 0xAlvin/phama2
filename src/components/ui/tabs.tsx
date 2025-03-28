"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import '@/styles/components.css'; // Change to absolute import

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("tabs", className)}
    {...props}
  />
))
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("tabs-list", className)}
    role="tablist"
    {...props}
  />
))
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error("TabsTrigger must be used within a TabsProvider");
    }
    
    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        className={cn(
          "tabs-trigger",
          isActive && "tabs-trigger-active",
          className
        )}
        onClick={() => setActiveTab(value)}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error("TabsContent must be used within a TabsProvider");
    }
    
    const { activeTab } = context;
    const isActive = activeTab === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("tabs-content", className)}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

// Context to manage active tab state
interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

interface TabsProviderProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const TabsProvider = ({
  defaultValue,
  value,
  onValueChange,
  children
}: TabsProviderProps) => {
  const [activeTab, setActiveTabInternal] = React.useState(defaultValue || "");
  
  const setActiveTab = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setActiveTabInternal(newValue);
    }
    onValueChange?.(newValue);
  }, [onValueChange, value]);
  
  // If controlled value changes, update internal state
  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTabInternal(value);
    }
  }, [value]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

// Higher-order component to wrap Tabs with Provider
const Root = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }
>(({ defaultValue, value, onValueChange, children, ...props }, ref) => (
  <TabsProvider defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
    <Tabs ref={ref} {...props}>
      {children}
    </Tabs>
  </TabsProvider>
))
Root.displayName = "RootTabs"

export {
  Root as Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
}
