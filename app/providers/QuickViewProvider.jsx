import {createContext, useContext, useState} from 'react';

const QuickViewContext = createContext();

export function QuickViewProvider({children}) {
  const [isOpen, setOpen] = useState(false);
  const [handle, setHandle] = useState(null);

  return (
    <QuickViewContext.Provider
      value={{
        isOpen,
        handle,
        open: (h) => { setHandle(h); setOpen(true); },
        close: () => { setOpen(false); setHandle(null); }
      }}
    >
      {children}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  return useContext(QuickViewContext);
}
