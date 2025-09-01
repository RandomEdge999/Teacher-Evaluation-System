import React from 'react';
import { DomainScore } from '@/types';
import { TrendingUp, Award, Target } from 'lucide-react';

interface DomainSummaryProps {
  domainScores: DomainScore[];
  grandTotal: number;
  overallRating: { rating: string; color: string; percentage: number };
}

export default function DomainSummary({ domainScores, grandTotal, overallRating }: DomainSummaryProps) {
  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'satisfactory':
        return 'text-yellow-600 bg-yellow-100';
      case 'needs improvement':
        return 'text-orange-600 bg-orange-100';
      case 'unsatisfactory':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Evaluation Summary</h2>
      </div>
      
      <div className="p-6">
        {/* Overall Rating */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="h-6 w-6 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Overall Rating</h3>
                <p className="text-sm text-gray-600">Based on all domain scores</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(overallRating.rating)}`}>
                {overallRating.rating}
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {overallRating.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Domain Scores */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">Domain Breakdown</h3>
          {domainScores.map((domain) => (
            <div key={domain.domainId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-primary-600" />
                <div>
                  <h4 className="font-medium text-gray-900">{domain.domainName}</h4>
                  <p className="text-sm text-gray-600">
                    {domain.itemScores.filter(score => score.rating !== undefined && score.rating !== null).length} of {domain.itemScores.length} items rated
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {domain.total} / {domain.itemScores.length * 4}
                </div>
                <div className="text-sm text-gray-600">
                  {domain.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Grand Total</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                {grandTotal}
              </div>
              <div className="text-sm text-gray-600">
                Total points across all domains
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
