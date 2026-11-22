import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
    Home,
    Users,
    UserCheck,
    Calendar,
    CreditCard,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    FileText,
} from 'lucide-react';


const Layout = ({ children }) => {
    const { state, logout, toggleTheme } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'employee'] },
        { path: '/members', label: 'Members', icon: Users, roles: ['admin', 'employee'] },
        { path: '/trainers', label: 'Trainers', icon: UserCheck, roles: ['admin', 'employee'] },
        { path: '/classes', label: 'Classes', icon: Calendar, roles: ['admin', 'employee'] },
        { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin'] }, // Changed from Subscriptions
        { path: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin'] }, // Hidden for employee
        { path: '/users', label: 'Users', icon: Users, roles: ['admin'] }, // Moved here
    ];

    const isActiveRoute = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile header */}
            <div className="lg:hidden bg-card border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-primary">GymFlow</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8"
                        onClick={toggleTheme}
                    >
                        {state.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex">
                {/* Sidebar */}
                <aside className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          w-64 bg-card border-r transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-primary">GymFlow</h1>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full h-8 w-8"
                                    onClick={toggleTheme}
                                >
                                    {state.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <nav className="space-y-2">
                            {navItems.map((item) => {
                                // Filter based on role
                                if (item.roles && !item.roles.includes(state.user?.role)) {
                                    return null;
                                }

                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                      ${isActiveRoute(item.path)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }
                    `}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-6 border-t bg-card">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-foreground">
                                    {state.user?.name?.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link to="/profile" className="block hover:underline">
                                    <p className="text-sm font-medium truncate">{state.user?.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{state.user?.email}</p>
                                </Link>
                            </div>
                        </div>



                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="w-full"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 lg:ml-64 transition-all duration-200">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
