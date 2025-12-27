"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ViewMode = "kanban" | "grid" | null;

interface PageHeaderContextType {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showNewButton: boolean;
  setShowNewButton: (show: boolean) => void;
  newButtonLabel: string;
  setNewButtonLabel: (label: string) => void;
  onNewClick: (() => void) | null;
  setOnNewClick: (handler: (() => void) | null) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(
  undefined
);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [showNewButton, setShowNewButton] = useState<boolean>(false);
  const [newButtonLabel, setNewButtonLabel] = useState<string>("Nouveau");
  const [onNewClick, setOnNewClick] = useState<(() => void) | null>(null);

  return (
    <PageHeaderContext.Provider
      value={{
        pageTitle,
        setPageTitle,
        viewMode,
        setViewMode,
        showNewButton,
        setShowNewButton,
        newButtonLabel,
        setNewButtonLabel,
        onNewClick,
        setOnNewClick,
      }}
    >
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (context === undefined) {
    throw new Error("usePageHeader must be used within a PageHeaderProvider");
  }
  return context;
}

