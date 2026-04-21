"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import styles from './TripStatusButton.module.css';

interface TripStatusButtonProps {
  tripId: string;
  isCompleted: boolean;
  onComplete: () => void;
}

export const TripStatusButton: React.FC<TripStatusButtonProps> = ({
  tripId,
  isCompleted,
  onComplete
}) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const handleComplete = () => {
    onComplete();
    setShowCompleted(true);
    setTimeout(() => setShowCompleted(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant={isCompleted ? 'outline' : 'default'}
      className={styles.button}
      onClick={handleComplete}
      disabled={isCompleted}
    >
      {isCompleted ? (
        <>
          <CheckIcon className={styles.completedIcon} />
          <span className={styles.completedTick}>✓</span>
        </>
      ) : (
        'Complete Trip'
      )}
      {showCompleted && <span className={styles.completedTick}>✓</span>}
    </Button>
  );
};