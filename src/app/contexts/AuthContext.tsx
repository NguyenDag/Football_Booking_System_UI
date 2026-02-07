import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedFields?: string[]; // For staff
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@football.com',
    role: 'ADMIN',
  },
  {
    id: '2',
    name: 'Nguyễn Văn A',
    email: 'staff@football.com',
    role: 'STAFF',
    assignedFields: ['1', '2'],
  },
  {
    id: '3',
    name: 'Trần Văn B',
    email: 'customer@football.com',
    role: 'CUSTOMER',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    const foundUser = mockUsers.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
