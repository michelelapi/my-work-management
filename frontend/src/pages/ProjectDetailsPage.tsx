import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, ProjectStatus } from '../types/project';
import { Task } from '../types/task';
import projectService from '../services/projectService';
import { taskService } from '../services/taskService';

interface ProjectSectionsState {
  isTasksExpanded: boolean;
}

const ProjectDetailsPage: React.FC = () => {
  const { companyId, projectId } = useParams<{ companyId: string; projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);

  // Load sections state from localStorage
  useEffect(() => {
    if (projectId) {
      const savedState = localStorage.getItem(`project-sections-${projectId}`);
      if (savedState) {
        const { isTasksExpanded } = JSON.parse(savedState) as ProjectSectionsState;
        setIsTasksExpanded(isTasksExpanded);
      }
    }
  }, [projectId]);

  // Save sections state to localStorage
  const saveSectionsState = (tasksExpanded: boolean) => {
    if (projectId) {
      const state: ProjectSectionsState = {
        isTasksExpanded: tasksExpanded,
      };
      localStorage.setItem(`project-sections-${projectId}`, JSON.stringify(state));
    }
  };

  // Update tasks expanded state
  const handleTasksToggle = (expanded: boolean) => {
    setIsTasksExpanded(expanded);
    saveSectionsState(expanded);
  };

  useEffect(() => {
    if (!companyId || !projectId) return;
    const companyIdNum = parseInt(companyId, 10);
    const projectIdNum = parseInt(projectId, 10);
    if (isNaN(companyIdNum) || isNaN(projectIdNum)) {
      setError('Invalid company or project ID');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [projectData, tasksData] = await Promise.all([
          projectService.getProjectById(companyIdNum, projectIdNum),
          taskService.getTasks(projectIdNum)
        ]);
        setProject(projectData);
        setTasks(tasksData.content);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId, projectId]);

  const handleDeleteTask = async (taskId: number) => {
    if (!companyId || !projectId || !window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskService.deleteTask(parseInt(projectId, 10), taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error || !project) {
    return <div className="text-red-500 text-center min-h-screen">{error || 'Project not found'}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Project Details Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
          </div>
          <button
            onClick={() => navigate(`/companies/${companyId}/projects/${projectId}/edit`)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Edit Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Information</h3>
            <p className="mt-1 text-gray-900 dark:text-white">
              Status: <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                project.status === ProjectStatus.ACTIVE ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                project.status === ProjectStatus.COMPLETED ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                project.status === ProjectStatus.ON_HOLD ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {project.status}
              </span>
            </p>
            <p className="mt-1 text-gray-900 dark:text-white">
              Start Date: {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
            </p>
            <p className="mt-1 text-gray-900 dark:text-white">
              End Date: {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Financial Information</h3>
            <p className="mt-1 text-gray-900 dark:text-white">
              Daily Rate: {project.dailyRate ? 
                `${project.currency === 'EUR' ? '€' : '$'}${project.dailyRate}` : 
                '-'
              }
            </p>
            <p className="mt-1 text-gray-900 dark:text-white">
              Hourly Rate: {project.hourlyRate ? 
                `${project.currency === 'EUR' ? '€' : '$'}${project.hourlyRate}` : 
                '-'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button
              onClick={() => handleTasksToggle(!isTasksExpanded)}
              className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isTasksExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tasks</h2>
          </div>
          <button
            onClick={() => navigate(`/companies/${companyId}/projects/${projectId}/tasks/new`)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Create New Task
          </button>
        </div>

        {isTasksExpanded && (
          <>
            {tasks.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
                No tasks found. Create your first task!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {task.startDate ? new Date(task.startDate).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-300">
                            {task.hoursWorked} hours
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.isBilled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {task.isBilled ? 'Billed' : 'Unbilled'}
                            </span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.isPaid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {task.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => navigate(`/companies/${companyId}/projects/${projectId}/tasks/${task.id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id!)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPage; 