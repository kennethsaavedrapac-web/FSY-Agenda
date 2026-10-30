import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { ensureDataPopulated } from '../db/seed';

export function useActivities() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    ensureDataPopulated()
      .then(() => setIsInitializing(false))
      .catch((err) => {
        console.error('Error seeding activities:', err);
        setIsInitializing(false);
      });
  }, []);

  const activities = useLiveQuery(
    () => db.activities.orderBy('sortOrder').toArray(),
    []
  );

  const reloadSchedule = async () => {
    await ensureDataPopulated(true);
  };

  return {
    activities: activities || [],
    isLoading: isInitializing || activities === undefined,
    reloadSchedule
  };
}

export function useActivity(id: number) {
  return useLiveQuery(() => db.activities.get(id), [id]);
}
