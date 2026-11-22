import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, DollarSign, TrendingUp, Calendar, AlertCircle, Plus, CheckCircle } from 'lucide-react';
import { paymentSchema } from '@/lib/schemas';

const SUBSCRIPTION_PRICES = {
    'Basic': 29,
    'Premium': 59,
    'VIP': 99
};

const Payments = () => {
    const { state, addPayment, updatePayment, deletePayment } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentPayment, setCurrentPayment] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        status: 'Pending',
        memberId: ''
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const result = paymentSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const formattedErrors = Object.keys(fieldErrors).reduce((acc, key) => {
                acc[key] = fieldErrors[key][0];
                return acc;
            }, {});
            setErrors(formattedErrors);
            return false;
        }
        setErrors({});
        return true;
    };

    const filteredPayments = state.payments.filter(payment => {
        const memberName = payment.memberId?.name || '';
        const plan = payment.memberId?.subscription || '';
        const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || payment.status.toLowerCase() === statusFilter;

        let matchesDate = true;
        if (dateFilter !== 'all') {
            const paymentDate = new Date(payment.date);
            const today = new Date();
            const daysDiff = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));

            switch (dateFilter) {
                case 'today':
                    matchesDate = daysDiff === 0;
                    break;
                case 'week':
                    matchesDate = daysDiff <= 7;
                    break;
                case 'month':
                    matchesDate = daysDiff <= 30;
                    break;
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const totalRevenue = state.payments
        .filter(p => p.status === 'Paid')
        .reduce((sum, payment) => sum + payment.amount, 0);

    const pendingAmount = state.payments
        .filter(p => p.status === 'Pending')
        .reduce((sum, payment) => sum + payment.amount, 0);

    const failedAmount = state.payments
        .filter(p => p.status === 'Failed')
        .reduce((sum, payment) => sum + payment.amount, 0);

    const thisMonthRevenue = state.payments
        .filter(p => {
            const paymentDate = new Date(p.date);
            const today = new Date();
            return p.status === 'Paid' &&
                paymentDate.getMonth() === today.getMonth() &&
                paymentDate.getFullYear() === today.getFullYear();
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const { toast } = useToast();

    const handleAddPayment = async () => {
        if (!validateForm()) return;

        const result = await addPayment({
            memberId: formData.memberId,
            amount: parseFloat(formData.amount),
            status: formData.status
        });
        if (result.success) {
            toast({ title: "Payment added", description: "Payment recorded successfully." });
            setIsAddDialogOpen(false);
            setFormData({ amount: '', status: 'Pending', memberId: '' });
            setErrors({});
        } else {
            toast({ title: "Error", description: result.message || "Failed to add payment.", variant: "destructive" });
        }
    };

    const handleEditClick = (payment) => {
        setCurrentPayment(payment);
        setFormData({
            memberId: payment.memberId?._id || payment.memberId || '',
            amount: payment.amount,
            status: payment.status
        });
        setErrors({});
        setIsEditDialogOpen(true);
    };

    const handleUpdatePayment = async () => {
        if (!currentPayment) return;
        if (!validateForm()) return;

        const result = await updatePayment(currentPayment.id || currentPayment._id, {
            memberId: formData.memberId,
            amount: parseFloat(formData.amount),
            status: formData.status
        });
        if (result.success) {
            toast({ title: "Payment updated", description: "Payment details updated successfully." });
            setIsEditDialogOpen(false);
            setCurrentPayment(null);
            setFormData({ amount: '', status: 'Pending', memberId: '' });
            setErrors({});
        } else {
            toast({ title: "Error", description: result.message || "Failed to update payment.", variant: "destructive" });
        }
    };

    const handleDeletePayment = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment record?')) {
            const result = await deletePayment(id);
            if (result.success) {
                toast({ title: "Payment deleted", description: "Payment record removed." });
            } else {
                toast({ title: "Error", description: result.message || "Failed to delete payment.", variant: "destructive" });
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Payments</h1>
                    <p className="text-muted-foreground">Track and manage gym membership payments</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => {
                                setFormData({ amount: '', status: 'Pending', memberId: '' });
                                setErrors({});
                            }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Payment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="memberSelect">Select Member</Label>
                                    <Select value={formData.memberId} onValueChange={(value) => {
                                        const member = state.members.find(m => (m.id || m._id) === value);
                                        const price = member ? SUBSCRIPTION_PRICES[member.subscription] : '';
                                        setFormData({
                                            ...formData,
                                            memberId: value,
                                            amount: price ? price.toString() : ''
                                        });
                                    }}>
                                        <SelectTrigger className={errors.memberId ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Select member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {state.members.filter(m => m.status === 'Active').map(member => (
                                                <SelectItem key={member.id || member._id} value={member.id || member._id}>
                                                    {member.name} ({member.subscription})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.memberId && <p className="text-sm text-destructive">{errors.memberId}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input id="amount" type="number" readOnly value={formData.amount} className={errors.amount ? 'border-destructive bg-muted' : 'bg-muted'} />
                                    {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                            <SelectItem value="Failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleAddPayment} className="flex-1">Add Payment</Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddDialogOpen(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Payment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-memberSelect">Member</Label>
                                    <Select value={formData.memberId} onValueChange={(value) => {
                                        const member = state.members.find(m => (m.id || m._id) === value);
                                        const price = member ? SUBSCRIPTION_PRICES[member.subscription] : '';
                                        setFormData({
                                            ...formData,
                                            memberId: value,
                                            amount: price ? price.toString() : ''
                                        });
                                    }}>
                                        <SelectTrigger className={errors.memberId ? 'border-destructive' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {state.members.map(member => (
                                                <SelectItem key={member.id || member._id} value={member.id || member._id}>
                                                    {member.name} ({member.subscription})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.memberId && <p className="text-sm text-destructive">{errors.memberId}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="edit-amount">Amount</Label>
                                    <Input id="edit-amount" type="number" readOnly value={formData.amount} className={errors.amount ? 'border-destructive bg-muted' : 'bg-muted'} />
                                    {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                            <SelectItem value="Failed">Failed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleUpdatePayment} className="flex-1">Update Payment</Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditDialogOpen(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>

            {/* Revenue Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {state.payments.filter(p => p.status === 'Paid').length} paid
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {state.payments.filter(p => p.status === 'Pending').length} pending
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Unpaid</p>
                                <p className="text-2xl font-bold">{formatCurrency(failedAmount)}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {state.payments.filter(p => p.status === 'Failed').length} failed
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Average Payment</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(state.payments.filter(p => p.status === 'Paid').length > 0 ? totalRevenue / state.payments.filter(p => p.status === 'Paid').length : 0)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search by member name or plan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Payment History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.map((payment) => (
                                    <TableRow key={payment.id || payment._id}>
                                        <TableCell className="font-medium">{payment.memberId?.name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <Badge className={getSubscriptionColor(payment.memberId?.subscription)}>
                                                {payment.memberId?.subscription || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell>{formatDate(payment.date)}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(payment.status)}>
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(payment)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeletePayment(payment.id || payment._id)}
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

                    {filteredPayments.length === 0 && (
                        <div className="text-center py-8">
                            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No payments found</h3>
                            <p className="text-muted-foreground">
                                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                    ? 'No payments match your search criteria.'
                                    : 'No payment records available.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Payments;
