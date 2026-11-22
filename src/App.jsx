import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/Members";
import Trainers from "@/pages/Trainers";
import Classes from "@/pages/Classes";
import Reports from './pages/Reports';
import Payments from "@/pages/Payments";
import Profile from "@/pages/Profile";
import Users from "@/pages/Users";
import NotFound from "./pages/NotFound";

import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <TooltipProvider>
                <AppProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />

                            {/* Protected routes */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Dashboard />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/members" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Members />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/trainers" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Trainers />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/classes" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Classes />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/reports" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Layout>
                                        <Reports />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/payments" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Layout>
                                        <Payments />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Profile />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/profile/security" element={
                                <ProtectedRoute>
                                    <Layout>
                                        <Profile />
                                    </Layout>
                                </ProtectedRoute>
                            } />
                            <Route path="/users" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Layout>
                                        <Users />
                                    </Layout>
                                </ProtectedRoute>
                            } />

                            {/* Catch-all route */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </AppProvider>
            </TooltipProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;
