import { createContext, useContext, useState, useCallback } from "react";

const NotifContext = createContext(null);

let _id = 0;

export function NotifProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [inbox, setInbox] = useState([]);

  const push = useCallback((title, body = "", type = "info", onClick = null) => {
    const id = ++_id;
    const item = { id, title, body, type, time: Date.now(), onClick };
    setToasts(p => [item, ...p].slice(0, 5));
    setInbox(p => [item, ...p].slice(0, 50));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  }, []);

  const dismiss = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  const clearInbox = useCallback(() => setInbox([]), []);

  return (
    <NotifContext.Provider value={{ toasts, inbox, push, dismiss, clearInbox }}>
      {children}
    </NotifContext.Provider>
  );
}

export const useNotif = () => useContext(NotifContext);
