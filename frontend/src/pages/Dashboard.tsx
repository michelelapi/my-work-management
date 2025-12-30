import React from 'react';
import CompanyStats from '../components/CompanyStats';
import ProjectCostsChart from '../components/ProjectCostsChart';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
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