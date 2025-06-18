import React, { useEffect, useState, useMemo } from 'react';
import * as Recharts from 'recharts';
import { ProjectCost, statisticsService } from '../services/statisticsService';

const ProjectCostsChart: React.FC = () => {
  const [rawCosts, setRawCosts] = useState<ProjectCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const costs = await statisticsService.getProjectCosts();
        setRawCosts(costs);
      } catch (err) {
        setError('Failed to fetch project costs');
        console.error('Error fetching project costs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processedData = useMemo(() => {
    const dataMap = new Map<string, { [key: string]: string | number }>();
    const projectNames = new Set<string>();

    rawCosts.forEach(item => {
      if (!dataMap.has(item.month)) {
        dataMap.set(item.month, { month: item.month });
      }
      const monthData = dataMap.get(item.month)!;
      monthData[item.projectName] = (monthData[item.projectName] || 0) as number + item.totalCost;
      projectNames.add(item.projectName);
    });

    // Convert Map values to array and sort by month for chronological display
    const sortedData = Array.from(dataMap.values()).sort((a, b) => {
      const monthA = a.month as string;
      const monthB = b.month as string;
      return monthA.localeCompare(monthB);
    });
    
    return { data: sortedData, projectNames: Array.from(projectNames).sort() };
  }, [rawCosts]);

  // Simple color palette (you might want a more sophisticated one)
  const colors = useMemo(() => {
    const projectColors: { [key: string]: string } = {};
    const baseColors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'
    ];
    processedData.projectNames.forEach((name, index) => {
      projectColors[name] = baseColors[index % baseColors.length];
    });
    return projectColors;
  }, [processedData.projectNames]);

  if (loading) {
    return <div className="animate-pulse">Loading project costs...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Project Costs by Month
      </h3>
      <div className="h-[400px]">
        <Recharts.ResponsiveContainer width="100%" height="100%">
          <Recharts.BarChart
            data={processedData.data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <Recharts.CartesianGrid strokeDasharray="3 3" />
            <Recharts.XAxis dataKey="month" />
            <Recharts.YAxis />
            <Recharts.Tooltip />
            <Recharts.Legend />
            {processedData.projectNames.map(name => (
              <Recharts.Bar key={name} dataKey={name} stackId="a" fill={colors[name]} name={name} />
            ))}
          </Recharts.BarChart>
        </Recharts.ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectCostsChart; 