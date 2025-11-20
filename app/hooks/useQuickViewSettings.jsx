import { useEffect, useState } from 'react';

export function useQuickViewSettings() {
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    }
    load();
  }, []);

  return settings;
}
