import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Save, 
  Send, 
  Eye, 
  Download, 
  FileText, 
  Upload,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Target,
  User
} from 'lucide-react';
import { 
  RubricDomain, 
  Branch, 
  Teacher, 
  ObservationFormData,
  ObservationStatus,
  RatingScale
} from '@/types';
import { 
  calculateDomainScores, 
  calculateGrandTotal, 
  calculateOverallRating,
  validateObservationData 
} from '@/utils/scoring';
import RubricGrid from './RubricGrid';
import DomainSummary from './DomainSummary';

interface ObservationFormProps {
  domains: RubricDomain[];
  branches: Branch[];
  teachers: Teacher[];
  initialData?: Partial<ObservationFormData>;
  onSubmit: (data: ObservationFormData) => void;
  onSaveDraft: (data: ObservationFormData) => void;
  disabled?: boolean;
  className?: string;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({
  domains,
  branches,
  teachers,
  initialData,
  onSubmit,
  onSaveDraft,
  disabled = false,
  className = ''
}) => {
  const [itemScores, setItemScores] = useState<Record<string, { rating: RatingScale; comment: string }>>(
    initialData?.itemScores || {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<ObservationFormData>({
    defaultValues: {
      branchId: initialData?.branchId || '',
      teacherId: initialData?.teacherId || '',
      classSection: initialData?.classSection || '',
      totalStudents: initialData?.totalStudents || 0,
      presentStudents: initialData?.presentStudents || 0,
      subject: initialData?.subject || '',
      topic: initialData?.topic || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      time: initialData?.time || '',
      lessonPlanAttached: initialData?.lessonPlanAttached || false,
      strengths: initialData?.strengths || '',
      areasToImprove: initialData?.areasToImprove || '',
      suggestions: initialData?.suggestions || '',
      itemScores: initialData?.itemScores || {}
    }
  });

  // Watch form values for real-time calculations
  const watchedValues = watch();

  // Calculate domain scores and totals
  const domainScores = calculateDomainScores(domains, itemScores);
  const grandTotal = calculateGrandTotal(domainScores);
  const overallRating = calculateOverallRating(domainScores);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isDirty && Object.keys(itemScores).length > 0) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isDirty, itemScores]);

  const handleAutoSave = useCallback(async () => {
    try {
      const formData = {
        ...watchedValues,
        itemScores
      };
      await onSaveDraft(formData);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [watchedValues, itemScores, onSaveDraft]);

  const handleRatingChange = (itemId: string, rating: RatingScale) => {
    setItemScores(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        rating,
        comment: prev[itemId]?.comment || ''
      }
    }));
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    setItemScores(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        rating: prev[itemId]?.rating || 0,
        comment
      }
    }));
  };

  const handleFormSubmit = async (data: ObservationFormData) => {
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      // Validate the complete form data
      const completeData = {
        ...data,
        itemScores
      };

      const validation = validateObservationData(completeData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Submit the form
      await onSubmit(completeData);
      
      // Reset form after successful submission
      setItemScores({});
      setValue('branchId', '');
      setValue('teacherId', '');
      setValue('classSection', '');
      setValue('totalStudents', 0);
      setValue('presentStudents', 0);
      setValue('subject', '');
      setValue('topic', '');
      setValue('date', new Date().toISOString().split('T')[0]);
      setValue('time', '');
      setValue('lessonPlanAttached', false);
      setValue('strengths', '');
      setValue('areasToImprove', '');
      setValue('suggestions', '');
      
    } catch (error) {
      console.error('Form submission failed:', error);
      setValidationErrors(['Failed to submit form. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const formData = {
        ...watchedValues,
        itemScores
      };
      await onSaveDraft(formData);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save draft failed:', error);
      setValidationErrors(['Failed to save draft. Please try again.']);
    }
  };

  const getFilteredTeachers = (branchId: string) => {
    if (!branchId) return [];
    return teachers.filter(teacher => teacher.branchId === branchId);
  };

  const selectedBranchId = watch('branchId');
  const filteredTeachers = getFilteredTeachers(selectedBranchId);

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Classroom Observation Form</h2>
            <p className="text-gray-600 mt-1">Complete evaluation of teacher performance and classroom dynamics</p>
          </div>
          <div className="flex items-center space-x-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={disabled || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Branch Selection */}
            <div>
              <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-2">
                Branch *
              </label>
              <select
                id="branchId"
                {...register('branchId', { required: 'Branch is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="mt-1 text-sm text-red-600">{errors.branchId.message}</p>
              )}
            </div>

            {/* Teacher Selection */}
            <div>
              <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-2">
                Teacher *
              </label>
              <select
                id="teacherId"
                {...register('teacherId', { required: 'Teacher is required' })}
                disabled={!selectedBranchId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a teacher</option>
                {filteredTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName} - {teacher.subjectPrimary}
                  </option>
                ))}
              </select>
              {errors.teacherId && (
                <p className="mt-1 text-sm text-red-600">{errors.teacherId.message}</p>
              )}
            </div>

            {/* Class Section */}
            <div>
              <label htmlFor="classSection" className="block text-sm font-medium text-gray-700 mb-2">
                Class/Section *
              </label>
              <input
                type="text"
                id="classSection"
                {...register('classSection', { required: 'Class/Section is required' })}
                placeholder="e.g., Grade 10-A, Class 12-B"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.classSection && (
                <p className="mt-1 text-sm text-red-600">{errors.classSection.message}</p>
              )}
            </div>

            {/* Total Students */}
            <div>
              <label htmlFor="totalStudents" className="block text-sm font-medium text-gray-700 mb-2">
                Total Students *
              </label>
              <input
                type="number"
                id="totalStudents"
                {...register('totalStudents', { 
                  required: 'Total students is required',
                  min: { value: 1, message: 'Must be at least 1' }
                })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.totalStudents && (
                <p className="mt-1 text-sm text-red-600">{errors.totalStudents.message}</p>
              )}
            </div>

            {/* Present Students */}
            <div>
              <label htmlFor="presentStudents" className="block text-sm font-medium text-gray-700 mb-2">
                Present Students *
              </label>
              <input
                type="number"
                id="presentStudents"
                {...register('presentStudents', { 
                  required: 'Present students is required',
                  min: { value: 0, message: 'Cannot be negative' }
                })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.presentStudents && (
                <p className="mt-1 text-sm text-red-600">{errors.presentStudents.message}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                {...register('subject', { required: 'Subject is required' })}
                placeholder="e.g., Mathematics, Science, English"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            {/* Topic */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Topic/Lesson *
              </label>
              <input
                type="text"
                id="topic"
                {...register('topic', { required: 'Topic is required' })}
                placeholder="e.g., Quadratic Equations, Photosynthesis, Shakespeare"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.topic && (
                <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                id="date"
                {...register('date', { required: 'Date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                id="time"
                {...register('time', { required: 'Time is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
              )}
            </div>

            {/* Lesson Plan Attached */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lessonPlanAttached"
                {...register('lessonPlanAttached')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="lessonPlanAttached" className="ml-2 block text-sm text-gray-900">
                Lesson plan attached
              </label>
            </div>
          </div>
        </div>

        {/* Rubric Grid */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluation Rubric</h3>
          <RubricGrid
            domains={domains}
            itemScores={itemScores}
            onRatingChange={handleRatingChange}
            onCommentChange={handleCommentChange}
            disabled={disabled}
          />
        </div>

        {/* Domain Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluation Summary</h3>
          <DomainSummary
            domainScores={domainScores}
            grandTotal={grandTotal}
            overallRating={overallRating}
          />
        </div>

        {/* Additional Comments */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Comments</h3>
          <div className="space-y-6">
            {/* Strengths */}
            <div>
              <label htmlFor="strengths" className="block text-sm font-medium text-gray-700 mb-2">
                Strengths Observed
              </label>
              <textarea
                id="strengths"
                {...register('strengths')}
                rows={3}
                placeholder="Describe the teacher's strengths and positive aspects observed during the lesson..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Areas to Improve */}
            <div>
              <label htmlFor="areasToImprove" className="block text-sm font-medium text-gray-700 mb-2">
                Areas for Improvement
              </label>
              <textarea
                id="areasToImprove"
                {...register('areasToImprove')}
                rows={3}
                placeholder="Identify specific areas where the teacher could improve..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Suggestions */}
            <div>
              <label htmlFor="suggestions" className="block text-sm font-medium text-gray-700 mb-2">
                Suggestions for Growth
              </label>
              <textarea
                id="suggestions"
                {...register('suggestions')}
                rows={3}
                placeholder="Provide constructive suggestions for professional development and growth..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={disabled || isSubmitting}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Draft
          </button>
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Observation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ObservationForm;
