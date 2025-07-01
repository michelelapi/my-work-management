import React from 'react';
import CompanyStats from '../components/CompanyStats';
import ProjectCostsChart from '../components/ProjectCostsChart';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Dashboard</h1>

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