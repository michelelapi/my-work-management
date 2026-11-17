import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyProjectStats, statisticsService } from '../services/statisticsService';

// Helper function to format numbers with thousands separators
const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const getCompanyStatusBadgeClass = (status?: string): string => {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'INACTIVE':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'ARCHIVED':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    }
};

const getCompanyCardClass = (status?: string): string => {
    if (status === 'INACTIVE') {
        // Slightly darker than ACTIVE, but still lighter than the overview panel
        return 'bg-gray-50 dark:bg-[#323c4a] hover:bg-white dark:hover:bg-gray-600';
    }
    return 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600';
};

const isInactiveCompany = (status?: string): boolean => status === 'INACTIVE';

const getCompanyTitleClass = (status?: string): string =>
    isInactiveCompany(status)
        ? 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
        : 'text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white';

const getCompanyLabelClass = (status?: string): string =>
    isInactiveCompany(status)
        ? 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200'
        : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100';

const getCompanyHighlightClass = (status?: string): string =>
    isInactiveCompany(status)
        ? 'text-yellow-700 dark:text-yellow-600 group-hover:text-yellow-600 dark:group-hover:text-yellow-300'
        : 'text-yellow-600 dark:text-yellow-300 group-hover:text-yellow-500 dark:group-hover:text-yellow-200';

const CompanyStats: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CompanyProjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statisticsService.getCompanyProjectStats();
        setStats(data);
      } catch (err) {
        setError('Failed to fetch company statistics');
        console.error('Error fetching company stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading statistics...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Company Overview</h3>
      <div className="flex flex-row space-x-4 overflow-x-auto">
        {stats.map((stat) => (
          <div 
            key={stat.companyId} 
            onClick={() => navigate(`/companies/${stat.companyId}/edit`)}
            className={`group ${getCompanyCardClass(stat.companyStatus)} p-4 rounded-lg min-w-[320px] cursor-pointer hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className={`font-medium transition-colors duration-200 ${getCompanyTitleClass(stat.companyStatus)}`}>{stat.companyName}</h4>
              {stat.companyStatus && (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${getCompanyStatusBadgeClass(stat.companyStatus)}`}>
                  {stat.companyStatus}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className={`transition-colors duration-200 ${getCompanyLabelClass(stat.companyStatus)}`}>Projects: {stat.projectCount}</p>
                <p className={`transition-colors duration-200 ${getCompanyLabelClass(stat.companyStatus)}`}>Tasks: {stat.taskCount}</p>
                <p className={`transition-colors duration-200 ${getCompanyHighlightClass(stat.companyStatus)}`}>To be billed: {stat.currency === 'EUR' ? '€' : '$'}{formatNumber(stat.totalToBeBilledAmount ?? 0)}</p>
                <p className={`transition-colors duration-200 ${getCompanyHighlightClass(stat.companyStatus)}`}>To be paid: {stat.currency === 'EUR' ? '€' : '$'}{formatNumber(stat.totalToBePaidAmount ?? 0)}</p>
              </div>
              <div>
                <p className={`transition-colors duration-200 ${getCompanyLabelClass(stat.companyStatus)}`}>Total Hours: {formatNumber(stat.totalHours)}</p>
                <p className={`transition-colors duration-200 ${getCompanyLabelClass(stat.companyStatus)}`}>
                  Total Amount: {stat.currency === 'EUR' ? '€' : '$'}{formatNumber(stat.totalAmount ?? 0)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <p className="text-gray-600 dark:text-gray-300">No companies found</p>
        )}
      </div>
    </div>
  );
};

export default CompanyStats; 