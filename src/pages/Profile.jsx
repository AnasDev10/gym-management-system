import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Calendar, Eye, EyeOff, Shield, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { changePasswordSchema } from '@/lib/schemas';
import { z } from 'zod';

const Profile = () => {
    const { state } = useApp();
    const { user } = state;
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Sync tab with route
    const activeTab = location.pathname.includes('/security') ? 'security' : 'overview';

    const handleTabChange = (value) => {
        if (value === 'overview') {
            navigate('/profile');
        } else {
            navigate('/profile/security');
        }
    };

    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const result = changePasswordSchema.safeParse(passwords);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const formattedErrors = Object.keys(fieldErrors).reduce((acc, key) => {
                acc[key] = fieldErrors[key][0];
                return acc;
            }, {});
            setErrors(formattedErrors);

            // Only block submission if Old Password is empty.
            // This allows the server to perform the "Invalid old password" check
            // even if the new password fields aren't fully filled yet,
            // satisfying the requested validation order.
            if (fieldErrors.oldPassword) return false;
        }
        setErrors({});
        return true;
    };

    const resetPasswordForm = () => {
        setPasswords({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setErrors({});
        setShowOld(false);
        setShowNew(false);
        setShowConfirm(false);
    };

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwords.oldPassword,
                    newPassword: passwords.newPassword,
                    confirmPassword: passwords.confirmPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast({ title: "Password updated successfully" });
                resetPasswordForm();
                setIsPasswordModalOpen(false);
            } else {
                if (data.message === 'Invalid old password' || data.message === 'Old password is required') {
                    setErrors(prev => ({ ...prev, oldPassword: data.message }));
                } else if (data.message.toLowerCase().includes('match')) {
                    setErrors(prev => ({ ...prev, confirmPassword: data.message }));
                } else if (data.message.toLowerCase().includes('new password')) {
                    setErrors(prev => ({ ...prev, newPassword: data.message }));
                } else {
                    toast({ title: "Failed to update password", description: data.message, variant: "destructive" });
                }
            }
        } catch (error) {
            console.error(error);
            toast({ title: "An error occurred", variant: "destructive" });
        }
    };

    const getRoleColor = (role) => {
        return role === 'admin'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                    <p className="text-muted-foreground">Manage your personal information and account security</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="bg-background border-b rounded-none w-full justify-start h-auto p-0 gap-6">
                    <TabsTrigger
                        value="overview"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none"
                    >
                        Profile Info
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none"
                    >
                        Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-0">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-1 h-fit">
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <CardTitle className="text-2xl">{user?.name}</CardTitle>
                                <div className="mt-2 text-center">
                                    <Badge variant="outline" className={`px-3 py-1 ${getRoleColor(user?.role)}`}>
                                        {user?.role === 'admin' ? <ShieldCheck className="w-3 h-3 mr-1 inline" /> : <Shield className="w-3 h-3 mr-1 inline" />}
                                        {user?.role?.toUpperCase()}
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>

                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription>Your public profile details</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4">
                                    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</p>
                                            <p className="text-sm font-semibold">{user?.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Created</p>
                                            <p className="text-sm font-semibold">
                                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                Account Security
                            </CardTitle>
                            <CardDescription>Manage your authentication and protection settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card group hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <KeyRound className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Password</p>
                                        <p className="text-sm text-muted-foreground">Change your password to keep your account secure</p>
                                    </div>
                                </div>
                                <Dialog open={isPasswordModalOpen} onOpenChange={(open) => {
                                    setIsPasswordModalOpen(open);
                                    if (!open) resetPasswordForm();
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" onClick={resetPasswordForm}>
                                            Update Password
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Update Password</DialogTitle>
                                            <DialogDescription>
                                                Enter your current password and a new one to update your credentials.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handlePasswordUpdate}>
                                            <div className="grid gap-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="oldPassword">Current Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="oldPassword"
                                                            name="oldPassword"
                                                            type={showOld ? "text" : "password"}
                                                            value={passwords.oldPassword}
                                                            onChange={handleChange}
                                                            className={errors.oldPassword ? 'border-destructive' : ''}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowOld(!showOld)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                    {errors.oldPassword && <p className="text-sm text-destructive">{errors.oldPassword}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword">New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="newPassword"
                                                            name="newPassword"
                                                            type={showNew ? "text" : "password"}
                                                            value={passwords.newPassword}
                                                            onChange={handleChange}
                                                            className={errors.newPassword ? 'border-destructive' : ''}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNew(!showNew)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                    {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="confirmPassword"
                                                            name="confirmPassword"
                                                            type={showConfirm ? "text" : "password"}
                                                            value={passwords.confirmPassword}
                                                            onChange={handleChange}
                                                            className={errors.confirmPassword ? 'border-destructive' : ''}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirm(!showConfirm)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                                                </div>
                                            </div>
                                            <DialogFooter className="flex gap-2">
                                                <Button type="submit" className="flex-1">Save Changes</Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="flex-1 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setIsPasswordModalOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="p-4 rounded-lg border bg-muted/20">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Security Best Practices</p>
                                        <ul className="mt-2 text-xs text-muted-foreground space-y-1 list-disc ml-4">
                                            <li>Use a unique password you don't use elsewhere</li>
                                            <li>Include a mix of symbols, numbers, and uppercase letters</li>
                                            <li>Never share your credentials with anyone</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Profile;
