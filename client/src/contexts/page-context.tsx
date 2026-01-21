import { createContext, useState, useContext, ReactNode } from 'react';

interface PageContextType {
  title?: string;
  subtitle?: string;
  setPageTitle: (title?: string, subtitle?: string) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string>();
  const [subtitle, setSubtitle] = useState<string>();

  const setPageTitle = (newTitle?: string, newSubtitle?: string) => {
    setTitle(newTitle);
    setSubtitle(newSubtitle);
  };

  return (
    <PageContext.Provider value={{ title, subtitle, setPageTitle }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within PageProvider');
  }
  return context;
}
