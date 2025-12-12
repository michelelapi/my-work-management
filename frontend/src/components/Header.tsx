import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [previousPathname, setPreviousPathname] = useState<string>('');
  const currentPathRef = useRef<string>(location.pathname);
  
  // Hide navigation links on login and register pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // Track previous pathname
  useEffect(() => {
    if (location.pathname !== currentPathRef.current && !isAuthPage) {
      setPreviousPathname(currentPathRef.current);
      currentPathRef.current = location.pathname;
    }
  }, [location.pathname, isAuthPage]);

  // Get page name from pathname
  const getPageName = (pathname: string): string => {
    if (pathname === '/dashboard' || pathname === '/') return 'Dashboard';
    if (pathname === '/companies' || pathname.startsWith('/companies') && !pathname.includes('/projects') && !pathname.includes('/tasks')) {
      if (pathname === '/companies') return 'Companies';
      if (pathname.includes('/edit')) return 'Edit Company';
      if (pathname.includes('/new')) return 'New Company';
      return 'Company Details';
    }
    if (pathname === '/projects' || pathname.includes('/projects')) {
      if (pathname === '/projects') return 'Projects';
      if (pathname.includes('/edit')) return 'Edit Project';
      if (pathname.includes('/new')) return 'New Project';
      return 'Project Details';
    }
    if (pathname === '/tasks' || pathname.includes('/tasks')) {
      if (pathname === '/tasks') return 'Tasks';
      if (pathname.includes('/edit')) return 'Edit Task';
      if (pathname.includes('/new')) return 'New Task';
      return 'Task Details';
    }
    if (pathname === '/ai-agent') return 'AI Agent';
    return 'Previous Page';
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const shouldShowBackButton = previousPathname && 
                                previousPathname !== location.pathname && 
                                location.pathname !== '/dashboard' &&
                                location.pathname !== '/';
  const previousPageName = shouldShowBackButton ? getPageName(previousPathname) : '';

  // Helper function to check if a path is active
  // Priority: Tasks > Projects > Companies > Dashboard > AI Agent
  const isActive = (path: string): boolean => {
    const currentPath = location.pathname;
    
    // Check tasks first (highest priority)
    if (path === '/tasks') {
      return currentPath === '/tasks' || 
             currentPath.startsWith('/tasks/') ||
             currentPath.includes('/tasks');
    }
    
    // Check projects (but not if tasks is active)
    if (path === '/projects') {
      const isTaskRoute = currentPath.includes('/tasks');
      return !isTaskRoute && (
        currentPath === '/projects' || 
        currentPath.startsWith('/projects/') ||
        currentPath.includes('/projects')
      );
    }
    
    // Check companies (but not if projects or tasks is active)
    if (path === '/companies') {
      const isProjectRoute = currentPath.includes('/projects');
      const isTaskRoute = currentPath.includes('/tasks');
      return !isProjectRoute && !isTaskRoute && currentPath.startsWith('/companies');
    }
    
    if (path === '/dashboard') {
      return currentPath === '/dashboard' || currentPath === '/';
    }
    
    if (path === '/ai-agent') {
      return currentPath === '/ai-agent';
    }
    
    return currentPath === path;
  };

  // Get active link classes
  const getLinkClasses = (path: string): string => {
    const baseClasses = "hover:text-gray-300 transition-colors";
    const activeClasses = isActive(path) 
      ? "text-purple-400 font-semibold" 
      : "";
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-purple-400 hover:text-purple-300">
          Work Management
        </Link>
        {!isAuthPage && (
          <nav>
            <ul className="flex space-x-4 items-center">
              {shouldShowBackButton && previousPageName && (
                <li>
                  <button
                    onClick={handleGoBack}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1.5 transition-colors focus:outline-none flex items-center gap-1.5 font-medium"
                    title={`Go back to previous page`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Back</span>
                  </button>
                </li>
              )}
              <li>
                <Link to="/dashboard" className={getLinkClasses('/dashboard')}>Dashboard</Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link to="/companies" className={getLinkClasses('/companies')}>Company</Link>
                  </li>
                  <li>
                    <Link to="/projects" className={getLinkClasses('/projects')}>Projects</Link>
                  </li>
                  <li>
                    <Link to="/tasks" className={getLinkClasses('/tasks')}>Tasks</Link>
                  </li>
                  <li>
                    <Link to="/ai-agent" className={getLinkClasses('/ai-agent')}>AI Agent</Link>
                  </li>
                  <li>
                    <button onClick={logout} className="hover:text-gray-300 focus:outline-none">
                      Logout
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={toggleTheme} 
                      className="hover:text-gray-300 focus:outline-none transition-colors p-1"
                      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                      {theme === 'light' ? (
                        // Light bulb ON (filled/yellow for light mode)
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.477.859h4z" />
                        </svg>
                      ) : (
                        // Light bulb OFF (outline for dark mode)
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-gray-300">Login</Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-gray-300">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header; 