import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search, Eye, EyeOff, Shield, User } from 'lucide-react';
import { z } from 'zod';

const userSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 chars').regex(/^[a-zA-Z\s]+$/, 'Name: letters/spaces only'),
    username: z.string().min(2, 'Username must be at least 2 chars'),
    password: z.string().min(6, 'Password min 6 chars').optional(),
    role: z.enum(['admin', 'employee']),
    status: z.enum(['active', 'inactive'])
});

const Users = () => {
    const { state, dispatch } = useApp();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const token = localStorage.getItem('token');

    // Dialog & Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'employee',
        status: 'active'
    });
    const [errors, setErrors] = useState({});

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                toast({ title: "Failed to fetch users", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            username: '',
            password: '',
            role: 'employee',
            status: 'active'
        });
        setEditingUser(null);
        setErrors({});
        setShowPassword(false);
    };

    const validateForm = () => {
        try {
            let schema = userSchema;
            // For creation, password is required
            if (!editingUser) {
                schema = userSchema.extend({
                    password: z.string().min(6, 'Password must be at least 6 characters')
                });
            } else {
                // For editing, password is optional and empty values should be ignored
                schema = userSchema.extend({
                    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal(''))
                });
            }

            schema.parse(formData);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors = error.flatten().fieldErrors;
                const formattedErrors = Object.keys(fieldErrors).reduce((acc, key) => {
                    acc[key] = fieldErrors[key][0];
                    return acc;
                }, {});
                setErrors(formattedErrors);
            }
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const method = editingUser ? 'PUT' : 'POST';
        const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';

        // Clean up data
        const submitData = { ...formData };
        if (editingUser && !submitData.password) {
            delete submitData.password;
        }
        if (!editingUser) {
            submitData.status = 'active'; // Always active on initial creation as per request
        }

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });
            const data = await res.json();

            if (res.ok) {
                toast({
                    title: editingUser ? "User updated" : "User created",
                    description: editingUser ? "User information has been updated successfully." : "New user has been created successfully."
                });

                // Check if we just updated the current logged in user
                if (editingUser && (editingUser._id === state.user.id || editingUser._id === state.user._id)) {
                    dispatch({
                        type: 'SET_USER',
                        payload: { ...state.user, ...data, id: data.id || data._id }
                    });
                }

                setIsDialogOpen(false);
                resetForm();
                fetchUsers();
            } else {
                toast({ title: "Operation failed", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            username: user.username,
            password: '', // Don't show password
            role: user.role,
            status: user.status || 'active'
        });
        setErrors({});
        setIsDialogOpen(true);
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast({ title: "User deleted successfully" });
                fetchUsers();
            } else {
                const data = await res.json();
                toast({ title: "Failed to delete user", description: data.message || "Could not delete", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'employee': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (state.user?.role !== 'admin') {
        return <div className="p-8 text-center">Access Denied. Admin only.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">Manage system access and roles</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={resetForm}>
                            <Plus className="h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className={errors.username ? 'border-destructive' : ''}
                                />
                                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>{editingUser ? 'New Password (Optional)' : 'Password'}</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                                        placeholder={editingUser ? "Leave blank to keep current" : ""}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>
                            <div className={`grid ${editingUser ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Employee</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {editingUser && (
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1">
                                    {editingUser ? 'Update User' : 'Create User'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        All Users
                    </CardTitle>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search users by name or username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-primary/10 text-primary">
                                                            {user.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-xs text-muted-foreground">{user.username}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getRoleColor(user.role)}>
                                                    <Shield className="h-3 w-3 mr-1 inline" />
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(user.status || 'active')}>
                                                    <div className={`w-2 h-2 rounded-full mr-1.5 ${user.status === 'inactive' ? 'bg-red-500' : 'bg-green-500'}`} />
                                                    {user.status || 'active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteUser(user._id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Users;
