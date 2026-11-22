import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users, Mail, Phone, Calendar, User } from 'lucide-react';

import { memberSchema } from '@/lib/schemas';

const Members = () => {
    const { state, addMember, updateMember, deleteMember, updateClass } = useApp();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subscription: 'Basic',
        status: 'Active',
        assignedClass: null
    });
    const [errors, setErrors] = useState({});

    const filteredMembers = state.members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
    );

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            subscription: 'Basic',
            status: 'Active',
            assignedClass: null
        });
        setErrors({});
        setEditingMember(null);
    };

    const validateForm = () => {
        const result = memberSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            // Map array of messages to single string for existing UI compatibility
            const formattedErrors = Object.keys(fieldErrors).reduce((acc, key) => {
                acc[key] = fieldErrors[key][0];
                return acc;
            }, {});
            setErrors(formattedErrors);
            return false;
        }

        // Check for duplicate email
        const existingMember = state.members.find(m =>
            m.email.toLowerCase() === formData.email.toLowerCase() &&
            (!editingMember || (m.id || m._id) !== (editingMember.id || editingMember._id))
        );

        if (existingMember) {
            setErrors(prev => ({ ...prev, email: 'Email already exists' }));
            return false;
        }

        setErrors({});
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Capacity Check
        if (formData.assignedClass) {
            const selectedClass = state.classes.find(c => (c.id || c._id) === formData.assignedClass);
            if (selectedClass) {
                const currentMemberClassId = editingMember?.assignedClass?._id || editingMember?.assignedClass;
                const isSameClass = editingMember && currentMemberClassId === formData.assignedClass;
                if (!isSameClass && selectedClass.enrolled >= selectedClass.capacity) {
                    toast({
                        title: "Class Full",
                        description: `The class "${selectedClass.name}" has reached its capacity (${selectedClass.capacity}).`,
                        variant: "destructive"
                    });
                    return;
                }
            }
        }

        const memberData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            subscription: formData.subscription,
            joinDate: editingMember?.joinDate || new Date().toISOString(),
            status: formData.status,
            assignedClass: formData.assignedClass
        };

        if (editingMember) {
            const result = await updateMember(editingMember.id || editingMember._id, memberData);
            if (result.success) {
                toast({
                    title: "Member updated",
                    description: "Member information has been updated successfully.",
                });
                resetForm();
                setIsDialogOpen(false);
            } else {
                if (result.message.includes("Phone")) {
                    setErrors(prev => ({ ...prev, phone: result.message }));
                } else {
                    toast({
                        title: "Error",
                        description: result.message || "Failed to update member",
                        variant: "destructive"
                    });
                }
            }
        } else {
            const result = await addMember(memberData);
            if (result.success) {
                toast({
                    title: "Member added",
                    description: "New member has been added successfully.",
                });
                resetForm();
                setIsDialogOpen(false);
            } else {
                if (result.message.includes("Phone")) {
                    setErrors(prev => ({ ...prev, phone: result.message }));
                } else {
                    toast({
                        title: "Error",
                        description: result.message || "Failed to add member",
                        variant: "destructive"
                    });
                }
            }
        }
    };

    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            phone: member.phone,
            subscription: member.subscription,
            status: member.status || 'Active',
            assignedClass: member.assignedClass?._id || member.assignedClass || null
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (memberId) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            const result = await deleteMember(memberId);
            if (result.success) {
                toast({
                    title: "Member deleted",
                    description: "Member has been removed from the system.",
                });
            } else {
                toast({
                    title: "Action Restricted",
                    description: result.message || "Failed to delete member",
                    variant: "destructive"
                });
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            case 'Expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSubscriptionColor = (subscription) => {
        switch (subscription) {
            case 'Basic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Premium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'VIP': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Members</h1>
                    <p className="text-muted-foreground">Manage gym members and their subscriptions</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingMember ? 'Edit Member' : 'Add New Member'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className={errors.email ? 'border-destructive' : ''}
                                />
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className={errors.phone ? 'border-destructive' : ''}
                                />
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                            </div>

                            {editingMember && (
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Expired">Expired</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="subscription">Subscription Plan</Label>
                                <Select value={formData.subscription} onValueChange={(value) => setFormData(prev => ({ ...prev, subscription: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Basic">Basic</SelectItem>
                                        <SelectItem value="Premium">Premium</SelectItem>
                                        <SelectItem value="VIP">VIP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="assignedClass">Assign Class (Optional)</Label>
                                <Select
                                    value={formData.assignedClass || "none"}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignedClass: value === "none" ? null : value }))}
                                    disabled={formData.status !== 'Active'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={formData.status !== 'Active' ? "Cannot assign class to inactive member" : "Select a class"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No class assigned</SelectItem>
                                        {state.classes.map(gymClass => {
                                            const classId = gymClass.id || gymClass._id;
                                            return (
                                                <SelectItem
                                                    key={classId}
                                                    value={classId}
                                                    disabled={gymClass.enrolled >= gymClass.capacity && classId !== (editingMember?.assignedClass?._id || editingMember?.assignedClass)}
                                                >
                                                    {gymClass.name} ({gymClass.enrolled}/{gymClass.capacity})
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1">
                                    {editingMember ? 'Update Member' : 'Add Member'}
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

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search members by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Members Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Members
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Subscription</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembers.map((member) => (
                                    <TableRow key={member.id || member._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="" alt={member.name} />
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        {member.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {member.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    {member.phone}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(member.status)}>
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getSubscriptionColor(member.subscription)}>
                                                {member.subscription}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(member.joinDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {member.assignedClass ? (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {member.assignedClass.name || 'Unknown Class'}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(member)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(member.id || member._id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {filteredMembers.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No members found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm ? 'No members match your search criteria.' : 'Start by adding your first member.'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Members;
