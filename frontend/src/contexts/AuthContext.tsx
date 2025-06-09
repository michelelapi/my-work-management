import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth';
import authService from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

// Initial state: isAuthenticated is false, user/token are null, isLoading is false by default for forms
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false, // Set initial isLoading to true to hold route during auth initialization
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  // Effect to initialize auth state from local storage on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = authService.getToken();
        const user = authService.getCurrentUser();

        // Note: isLoading is not set to true here as ProtectedRoute handles initial loading
        setState({
          user,
          token,
          isAuthenticated: !!token && !!user,
          isLoading: false, // Ensure isLoading is false after init
          error: null,
        });
      } catch (error) {
        console.error('Error initializing auth state:', error);
        setState({
          ...initialState,
          isLoading: false, // Ensure isLoading is false even if init fails
          error: 'Failed to initialize authentication state'
        });
      }
    };

    initAuth();
  }, []); // Empty dependency array means this runs once on mount

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null })); // Set isLoading to true before API call
    try {
      const response = await authService.login(credentials);
      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false, // Set isLoading to false on success
        error: null,
      });
      navigate('/dashboard');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false, // Set isLoading to false on error
        error: error instanceof Error ? error.message : 'An error occurred during login',
      }));
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null })); // Set isLoading to true before API call
    try {
      const response = await authService.register(credentials);
      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false, // Set isLoading to false on success
        error: null,
      });
      navigate('/dashboard');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false, // Set isLoading to false on error
        error: error instanceof Error ? error.message : 'An error occurred during registration',
      }));
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    // When logging out, reset to initial state, ensuring isLoading is false
    setState(initialState);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 