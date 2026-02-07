"use client";

import { ShotCircle } from "./ShotCircle";

interface ShotGroupProps {
  shots: (boolean | null)[];
  startIndex: number;
  currentShotIndex: number;
  isPlayerActive: boolean;
  onEditShot?: (index: number) => void;
}

export function ShotGroup({
  shots,
  startIndex,
  currentShotIndex,
  isPlayerActive,
  onEditShot,
}: ShotGroupProps) {
  const groupShots = shots.slice(startIndex, startIndex + 4);

  const handleShotEdit = (localIndex: number) => {
    const globalIndex = startIndex + localIndex;
    if (shots[globalIndex] !== null && onEditShot) {
      onEditShot(globalIndex);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-0.5 p-1">
      {groupShots.map((shot, localIndex) => (
        <ShotCircle
          key={localIndex}
          state={shot}
          isActive={isPlayerActive && startIndex + localIndex === currentShotIndex}
          onClick={shot !== null ? () => handleShotEdit(localIndex) : undefined}
          size="sm"
        />
      ))}
    </div>
  );
}
