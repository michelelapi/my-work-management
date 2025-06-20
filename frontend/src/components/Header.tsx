import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-purple-400 hover:text-purple-300">
          Work Management
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/dashboard" className="hover:text-gray-300">Dashboard</Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link to="/companies" className="hover:text-gray-300">Company</Link>
                </li>
                <li>
                  <Link to="/projects" className="hover:text-gray-300">Projects</Link>
                </li>
                <li>
                  <Link to="/tasks" className="hover:text-gray-300">Tasks</Link>
                </li>
                <li>
                  <Link to="/ai-agent" className="hover:text-gray-300">AI Agent</Link>
                </li>
                <li>
                  <button onClick={logout} className="hover:text-gray-300 focus:outline-none">
                    Logout
                  </button>
                </li>
                <li>
                  <button onClick={toggleTheme} className="hover:text-gray-300 focus:outline-none">
                    Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
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
      </div>
    </header>
  );
};

export default Header; 