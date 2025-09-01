import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, MessageSquareIcon } from 'lucide-react';
import { RubricDomain, RatingScale } from '@/types';
import RatingControl from './RatingControl';

interface RubricGridProps {
  domains: RubricDomain[];
  itemScores: Record<string, { rating: RatingScale; comment: string }>;
  onRatingChange: (itemId: string, rating: RatingScale) => void;
  onCommentChange: (itemId: string, comment: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const RubricGrid: React.FC<RubricGridProps> = ({
  domains,
  itemScores,
  onRatingChange,
  onCommentChange,
  disabled = false,
  compact = false
}) => {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleDomain = (domainId: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domainId)) {
      newExpanded.delete(domainId);
    } else {
      newExpanded.add(domainId);
    }
    setExpandedDomains(newExpanded);
  };

  const toggleComment = (itemId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedComments(newExpanded);
  };

  const getDomainProgress = (domain: RubricDomain) => {
    const ratedItems = domain.items.filter(item => 
      itemScores[item.id]?.rating !== undefined && itemScores[item.id]?.rating !== null && itemScores[item.id]?.rating !== 0
    ).length;
    const percentage = (ratedItems / domain.items.length) * 100;
    return { ratedItems, totalItems: domain.items.length, percentage };
  };

  return (
    <div className="space-y-4">
      {domains.map((domain) => {
        const progress = getDomainProgress(domain);
        const isExpanded = expandedDomains.has(domain.id);
        
        return (
          <div key={domain.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Domain Header */}
            <button
              onClick={() => toggleDomain(domain.id)}
              className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
              disabled={disabled}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {domain.name}
                    </h3>
                    <p className="text-sm text-gray-600">{domain.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Progress Indicator */}
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {progress.ratedItems}/{progress.totalItems} items rated
                    </div>
                    <div className="text-xs text-gray-500">
                      {progress.percentage.toFixed(0)}% complete
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>

            {/* Domain Items */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50">
                <div className="p-6 space-y-6">
                  {domain.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
                        {/* Item Description */}
                        <div className="flex-1">
                          <div className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                              {item.number}
                            </span>
                            <p className="text-gray-900 leading-relaxed">
                              {item.prompt}
                            </p>
                          </div>
                        </div>

                        {/* Rating Control */}
                        <div className="flex-shrink-0">
                          <RatingControl
                            value={itemScores[item.id]?.rating || null}
                            onChange={(rating) => onRatingChange(item.id, rating)}
                            maxScore={item.maxScore}
                            disabled={disabled}
                          />
                        </div>
                      </div>

                      {/* Comment Section */}
                      <div className="mt-4">
                        <button
                          onClick={() => toggleComment(item.id)}
                          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                          disabled={disabled}
                        >
                          <MessageSquareIcon className="w-4 h-4" />
                          <span>
                            {expandedComments.has(item.id) ? 'Hide comment' : 'Add comment'}
                          </span>
                        </button>
                        
                        {expandedComments.has(item.id) && (
                          <div className="mt-3">
                            <textarea
                              value={itemScores[item.id]?.comment || ''}
                              onChange={(e) => onCommentChange(item.id, e.target.value)}
                              placeholder="Add your observation notes here..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              rows={3}
                              disabled={disabled}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RubricGrid;
