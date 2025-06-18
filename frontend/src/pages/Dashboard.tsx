import React from 'react';
import CompanyStats from '../components/CompanyStats';
import ProjectCostsChart from '../components/ProjectCostsChart';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Dashboard</h1>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Welcome, michele!</h2>
        <p className="text-gray-700 dark:text-gray-400">Here's a summary of your financial overview.</p>
      </div>

      {/* Company Overview horizontal layout */}
      <div className=" w-full mb-6">
        <CompanyStats />
      </div>

      <div className="mt-6">
        <ProjectCostsChart />
      </div>
    </div>
  );
};

export default Dashboard; 