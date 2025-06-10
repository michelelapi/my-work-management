import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import CompanyListPage from './pages/CompanyListPage';
import CompanyFormPage from './pages/CompanyFormPage';
import CompanyContactFormPage from './pages/CompanyContactFormPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectFormPage from './pages/ProjectFormPage';
import TaskListPage from './pages/TaskListPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import TaskFormPage from './pages/TaskFormPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/companies" element={<ProtectedRoute><CompanyListPage /></ProtectedRoute>} />
                <Route path="/companies/new" element={<ProtectedRoute><CompanyFormPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId/edit" element={<ProtectedRoute><CompanyFormPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId" element={<ProtectedRoute><CompanyDetailsPage /></ProtectedRoute>} />
                
                <Route path="/companies/:companyId/contacts/new" element={<ProtectedRoute><CompanyContactFormPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId/contacts/:contactId/edit" element={<ProtectedRoute><CompanyContactFormPage /></ProtectedRoute>} />

                {/* Project Routes */}
                <Route path="/projects" element={<ProtectedRoute><ProjectListPage /></ProtectedRoute>} />
                <Route path="/projects/new" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId/projects" element={<ProtectedRoute><ProjectListPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId/projects/new" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId/projects/:projectId/edit" element={<ProtectedRoute><ProjectFormPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId/projects/:projectId" element={<ProjectDetailsPage />} />

                {/* Task Routes */}
                <Route path="/tasks" element={<ProtectedRoute><TaskListPage /></ProtectedRoute>} />
                <Route path="/tasks/new" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />
                <Route path="/projects/:projectId/tasks" element={<ProtectedRoute><TaskListPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId/projects/:projectId/tasks/new" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />
                <Route path="/companies/:companyId/projects/:projectId/tasks/:taskId/edit" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />

                <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App; 