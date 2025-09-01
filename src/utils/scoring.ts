import { 
  RubricDomain, 
  DomainScore, 
  ObservationItemScore, 
  OverallRatingThreshold,
  DEFAULT_OVERALL_RATING_THRESHOLDS,
  RatingScale
} from '@/types';

/**
 * Calculate domain scores for an observation
 */
export function calculateDomainScores(
  domains: RubricDomain[],
  itemScores: Record<string, { rating: RatingScale; comment: string }>
): DomainScore[] {
  return domains.map(domain => {
    const domainItemScores = domain.items.map(item => {
      const score = itemScores[item.id];
      return {
        id: `score-${item.id}`,
        observationId: 'temp',
        rubricItemId: item.id,
        rating: score?.rating || undefined,
        comment: score?.comment || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const applicableItems = domainItemScores.filter(score => 
      score.rating !== undefined && score.rating !== null
    );

    const total = applicableItems.reduce((sum, score) => sum + (score.rating || 0), 0);
    const maxPossibleScore = applicableItems.length * domain.items[0]?.maxScore || 0;
    const percentage = maxPossibleScore > 0 ? (total / maxPossibleScore) * 100 : 0;

    return {
      domainId: domain.id,
      domainName: domain.name,
      total,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      itemScores: domainItemScores
    };
  });
}

/**
 * Calculate grand total from domain scores
 */
export function calculateGrandTotal(domainScores: DomainScore[]): number {
  return domainScores.reduce((sum, domain) => sum + domain.total, 0);
}

/**
 * Calculate overall rating based on percentage thresholds
 */
export function calculateOverallRating(
  domainScores: DomainScore[],
  thresholds: OverallRatingThreshold[] = DEFAULT_OVERALL_RATING_THRESHOLDS
): { rating: string; color: string; percentage: number } {
  if (domainScores.length === 0) {
    return { rating: 'No Data', color: 'gray', percentage: 0 };
  }

  const grandTotal = calculateGrandTotal(domainScores);
  const totalMaxScore = domainScores.reduce((sum, domain) => {
    const applicableItems = domain.itemScores.filter(score => 
      score.rating !== undefined && score.rating !== 0
    );
    return sum + (applicableItems.length * 4); // Assuming max score is 4
  }, 0);

  const overallPercentage = totalMaxScore > 0 ? (grandTotal / totalMaxScore) * 100 : 0;
  const roundedPercentage = Math.round(overallPercentage * 100) / 100;

  // Find the appropriate threshold
  const threshold = thresholds.find(t => 
    roundedPercentage >= t.minPercentage && roundedPercentage <= t.maxPercentage
  );

  return {
    rating: threshold?.rating || 'Unknown',
    color: threshold?.color || 'gray',
    percentage: roundedPercentage
  };
}

/**
 * Get rating label for a numeric score
 */
export function getRatingLabel(score: number): string {
  const labels: Record<number, string> = {
    5: 'Excellent',
    4: 'Good', 
    3: 'Satisfactory',
    2: 'Needs Improvement',
    1: 'Unsatisfactory',
    0: 'Not Observed'
  };
  return labels[score] || 'Unknown';
}

/**
 * Get rating color for a numeric score
 */
export function getRatingColor(score: number): string {
  const colors: Record<number, string> = {
    5: 'success',
    4: 'primary',
    3: 'warning',
    2: 'warning',
    1: 'danger',
    0: 'gray'
  };
  return colors[score] || 'gray';
}

/**
 * Validate observation data
 */
export function validateObservationData(data: {
  totalStudents: number;
  presentStudents: number;
  itemScores: Record<string, { rating: RatingScale; comment: string }>;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.totalStudents <= 0) {
    errors.push('Total students must be greater than 0');
  }

  if (data.presentStudents < 0) {
    errors.push('Present students cannot be negative');
  }

  if (data.presentStudents > data.totalStudents) {
    errors.push('Present students cannot exceed total students');
  }

  const hasScores = Object.values(data.itemScores).some(score => score.rating !== undefined && score.rating !== 0);
  if (!hasScores) {
    errors.push('At least one rubric item must be scored');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate progress percentage for form completion
 */
export function calculateProgressPercentage(
  domains: RubricDomain[],
  itemScores: Record<string, { rating: RatingScale; comment: string }>
): number {
  const totalItems = domains.reduce((sum, domain) => sum + domain.items.length, 0);
  if (totalItems === 0) return 0;

  const scoredItems = Object.values(itemScores).filter(score => 
    score.rating !== undefined && score.rating !== 0
  ).length;

  return Math.round((scoredItems / totalItems) * 100);
}
