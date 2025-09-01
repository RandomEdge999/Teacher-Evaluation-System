import React from 'react';
import { RatingScale, RATING_LABELS, RATING_DESCRIPTIONS, getRatingColor } from '@/types';

interface RatingControlProps {
  value: RatingScale | null;
  onChange: (rating: RatingScale) => void;
  maxScore: number;
  disabled?: boolean;
}

export default function RatingControl({ value, onChange, maxScore, disabled = false }: RatingControlProps) {
  const handleRatingChange = (rating: RatingScale) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const getColorClass = (rating: RatingScale): string => {
    if (rating === value) {
      return 'bg-blue-500 text-white border-blue-500';
    }
    return 'bg-white text-gray-700 border-gray-300 hover:border-blue-300';
  };

  // Create rating options based on maxScore
  const ratingOptions: RatingScale[] = Array.from({ length: maxScore + 1 }, (_, i) => i as RatingScale)
    .sort((a, b) => (b as number) - (a as number)); // Sort descending: 5, 4, 3, 2, 1, 0

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap gap-2">
        {ratingOptions.map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            className={`
              px-3 py-2 rounded-lg border-2 font-medium text-sm transition-colors
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${rating === value 
                ? 'bg-blue-500 text-white border-blue-500' 
                : getColorClass(rating)
              }
            `}
            onClick={() => handleRatingChange(rating)}
            title={`${RATING_LABELS[rating]}: ${RATING_DESCRIPTIONS[rating]}`}
            aria-label={`Rate as ${RATING_LABELS[rating]}`}
          >
            {rating}
          </button>
        ))}
      </div>
      {value !== null && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Selected:</span> {RATING_LABELS[value]} - {RATING_DESCRIPTIONS[value]}
        </div>
      )}
    </div>
  );
}
