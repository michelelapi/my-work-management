import React, { useEffect, useState } from 'react';
import { CompanyProjectStats, statisticsService } from '../services/statisticsService';

const CompanyStats: React.FC = () => {
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
          <div key={stat.companyId} className="bg-white dark:bg-gray-700 p-4 rounded-lg min-w-[320px]">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{stat.companyName}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-300">Projects: {stat.projectCount}</p>
                <p className="text-gray-600 dark:text-gray-300">Tasks: {stat.taskCount}</p>
                <p className="text-yellow-600 dark:text-yellow-300">To be billed: {stat.currency === 'EUR' ? '€' : '$'}{(stat.totalToBeBilledAmount ?? 0).toFixed(2)}</p>
                <p className="text-yellow-600 dark:text-yellow-300">To be paid: {stat.currency === 'EUR' ? '€' : '$'}{(stat.totalToBePaidAmount ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300">Total Hours: {stat.totalHours}</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Total Amount: {stat.currency === 'EUR' ? '€' : '$'}{(stat.totalAmount ?? 0).toFixed(2)}
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