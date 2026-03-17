import React from 'react';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  }
];
