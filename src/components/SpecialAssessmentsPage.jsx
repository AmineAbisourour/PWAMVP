import { useState, useEffect } from 'react';
import { getSpecialAssessmentsByPurpose, updateContribution } from '../db/database';
import { AddSpecialAssessmentForm } from './AddSpecialAssessmentForm';
import { addBulkSpecialAssessment } from '../db/database';
import { formatCurrency } from '../utils/currency';
import { getCurrencyForCountry, getLocaleForCountry } from '../utils/countries';

export function SpecialAssessmentsPage({ hoa }) {
  const currency = getCurrencyForCountry(hoa.country);
  const locale = getLocaleForCountry(hoa.country);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAssessment, setExpandedAssessment] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, [hoa.id]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const data = await getSpecialAssessmentsByPurpose(hoa.id);
      setAssessments(data);
    } catch (error) {
      console.error('Error loading special assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaymentStatus = async (assessmentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      await updateContribution(assessmentId, { paymentStatus: newStatus });
      await loadAssessments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  const handleCreateAssessment = async (data) => {
    try {
      await addBulkSpecialAssessment(data);
      setShowCreateForm(false);
      await loadAssessments();
    } catch (error) {
      console.error('Error creating special assessment:', error);
      alert('Failed to create special assessment. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading special assessments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Special Assessments</h1>
          <p className="text-gray-600">
            Manage extraordinary contributions for special projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Assessment
        </button>
      </div>

      {/* Summary Cards */}
      {assessments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Active Projects</h3>
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {assessments.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Ongoing assessments
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Expected</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(assessments.reduce((sum, a) => sum + a.totalAmount, 0), currency, locale)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Across all projects
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Collection Rate</h3>
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {(() => {
                const totalAmount = assessments.reduce((sum, a) => sum + a.totalAmount, 0);
                const paidAmount = assessments.reduce((sum, a) => sum + a.paidAmount, 0);
                const rate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
                return `${rate.toFixed(1)}%`;
              })()}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Overall payment rate
            </div>
          </div>
        </div>
      )}

      {/* Assessment Projects List */}
      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Special Assessments</h3>
          <p className="text-gray-600 mb-6">
            You haven't created any special assessments yet. Create one to track extraordinary contributions for special projects.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create First Assessment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment, index) => {
            const collectionRate = assessment.totalAmount > 0
              ? (assessment.paidAmount / assessment.totalAmount) * 100
              : 0;
            const isExpanded = expandedAssessment === assessment.purpose;

            return (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Assessment Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedAssessment(isExpanded ? null : assessment.purpose)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{assessment.purpose}</h3>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          collectionRate >= 90 ? 'bg-green-100 text-green-800' :
                          collectionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {assessment.paidCount}/{assessment.totalCount} Units Paid
                        </span>
                      </div>
                      {assessment.assessments[0]?.notes && (
                        <p className="text-sm text-gray-600 mb-3">{assessment.assessments[0].notes}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total Amount:</span>
                          <p className="font-bold text-gray-900">{formatCurrency(assessment.totalAmount, currency, locale)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Collected:</span>
                          <p className="font-bold text-green-600">{formatCurrency(assessment.paidAmount, currency, locale)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Pending:</span>
                          <p className="font-bold text-orange-600">{formatCurrency(assessment.pendingAmount, currency, locale)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Due Date:</span>
                          <p className="font-bold text-gray-900">
                            {assessment.assessments[0]?.startMonth ? formatDate(assessment.assessments[0].startMonth) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <svg
                        className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${collectionRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{collectionRate.toFixed(1)}% collected</span>
                    <span>{formatCurrency(assessment.pendingAmount, currency, locale)} remaining</span>
                  </div>
                </div>

                {/* Expanded Unit Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Unit Payment Status</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                      {assessment.assessments
                        .sort((a, b) => a.unitNumber - b.unitNumber)
                        .map((unit) => (
                          <button
                            key={unit.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePaymentStatus(unit.id, unit.paymentStatus);
                            }}
                            className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                              unit.paymentStatus === 'paid'
                                ? 'bg-green-100 border-green-500 text-green-800'
                                : 'bg-white border-orange-300 text-orange-700'
                            }`}
                          >
                            <div className="font-bold text-lg mb-1">Unit {unit.unitNumber}</div>
                            <div className="text-xs font-semibold mb-1">
                              {formatCurrency(unit.amount, currency, locale)}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              unit.paymentStatus === 'paid'
                                ? 'bg-green-200'
                                : 'bg-orange-200'
                            }`}>
                              {unit.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                            </div>
                          </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                      Click on any unit to toggle payment status
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assessment Form Modal */}
      {showCreateForm && (
        <AddSpecialAssessmentForm
          hoa={hoa}
          onCancel={() => setShowCreateForm(false)}
          onCreate={handleCreateAssessment}
        />
      )}
    </div>
  );
}
