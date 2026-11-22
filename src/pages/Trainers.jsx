import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Mail, Award, Users, Plus, Search, Phone } from 'lucide-react';
import { trainerSchema } from '@/lib/schemas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Trainers = () => {
    const { state, addTrainer, updateTrainer, deleteTrainer } = useApp();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentTrainer, setCurrentTrainer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        experience: '',
        rating: 0,
        status: 'Active',
        image: '/placeholder.svg'
    });
    const [errors, setErrors] = useState({});

    // Filter trainers based on search
    const filteredTrainers = state.trainers.filter(trainer =>
        trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                className={`h-4 w-4 ${index < Math.floor(rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                    }`}
            />
        ));
    };

    const validateForm = () => {
        const result = trainerSchema.safeParse(formData);
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

    const handleAddTrainer = async () => {
        if (!validateForm()) return;

        const result = await addTrainer({
            ...formData,
            experience: parseInt(formData.experience),
            rating: parseFloat(formData.rating)
        });
        if (result.success) {
            setIsAddDialogOpen(false);
            setFormData({ name: '', email: '', phone: '', specialization: '', experience: '', rating: 0, status: 'Active', image: '/placeholder.svg' });
            setErrors({});
            toast({
                title: "Trainer added",
                description: "New trainer has been added successfully.",
            });
        } else {
            if (result.message.includes("Phone")) {
                setErrors(prev => ({ ...prev, phone: result.message }));
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to add trainer",
                    variant: "destructive"
                });
            }
        }
    };

    const handleEditClick = (trainer) => {
        setCurrentTrainer(trainer);
        setFormData({
            name: trainer.name,
            email: trainer.email,
            phone: trainer.phone || '',
            specialization: trainer.specialization,
            experience: trainer.experience || '',
            rating: trainer.rating || 0,
            status: trainer.status || 'Active',
            image: trainer.image || '/placeholder.svg'
        });
        setErrors({});
        setIsEditDialogOpen(true);
    };

    const handleUpdateTrainer = async () => {
        if (!currentTrainer) return;
        if (!validateForm()) return;

        const result = await updateTrainer(currentTrainer.id, {
            ...formData,
            experience: parseInt(formData.experience),
            rating: parseFloat(formData.rating)
        });
        if (result.success) {
            setIsEditDialogOpen(false);
            setCurrentTrainer(null);
            setFormData({ name: '', email: '', phone: '', specialization: '', experience: '', rating: 0, status: 'Active', image: '/placeholder.svg' });
            toast({
                title: "Trainer updated",
                description: "Trainer information has been updated successfully.",
            });
        } else {
            if (result.message.includes("Phone")) {
                setErrors(prev => ({ ...prev, phone: result.message }));
            } else {
                toast({
                    title: "Error",
                    description: result.message || "Failed to update trainer",
                    variant: "destructive"
                });
            }
        }
    };

    const handleDeleteTrainer = async (id) => {
        if (window.confirm('Are you sure you want to delete this trainer?')) {
            await deleteTrainer(id);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'On Leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Trainers</h1>
                    <p className="text-muted-foreground">Meet our professional fitness trainers</p>
                </div>

                {/* Add Dialog Trigger (same as before) */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setFormData({ name: '', email: '', phone: '', specialization: '', experience: '', rating: 0, image: '/placeholder.svg' })}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Trainer
                        </Button>
                    </DialogTrigger>
                    {/* ... (Dialog Content same as before) ... */}
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Trainer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* ... (Form inputs same as before) ... */}
                            <div>
                                <Label htmlFor="add-name">Name</Label>
                                <Input id="add-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? 'border-destructive' : ''} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="add-email">Email</Label>
                                <Input id="add-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={errors.email ? 'border-destructive' : ''} />
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-phone">Phone</Label>
                                <Input id="add-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={errors.phone ? 'border-destructive' : ''} />
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-specialization">Specialization</Label>
                                <Input id="add-specialization" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} className={errors.specialization ? 'border-destructive' : ''} />
                                {errors.specialization && <p className="text-sm text-destructive">{errors.specialization}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-experience">Experience (years)</Label>
                                <Input id="add-experience" type="number" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className={errors.experience ? 'border-destructive' : ''} />
                                {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-rating">Rating</Label>
                                <Input id="add-rating" type="number" step="0.1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} className={errors.rating ? 'border-destructive' : ''} />
                                {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleAddTrainer} className="flex-1">Add Trainer</Button>
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

                {/* Edit Dialog (same as before, wrapped) */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    {/* ... (Edit Dialog Content same as before) ... */}
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Trainer</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? 'border-destructive' : ''} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="edit-status">Status</Label>
                                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="On Leave">On Leave</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={errors.email ? 'border-destructive' : ''} />
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>
                            <div>
                                <Label htmlFor="edit-phone">Phone</Label>
                                <Input id="edit-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={errors.phone ? 'border-destructive' : ''} />
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                            </div>
                            <div>
                                <Label htmlFor="edit-specialization">Specialization</Label>
                                <Input id="edit-specialization" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} className={errors.specialization ? 'border-destructive' : ''} />
                                {errors.specialization && <p className="text-sm text-destructive">{errors.specialization}</p>}
                            </div>
                            <div>
                                <Label htmlFor="edit-experience">Experience (years)</Label>
                                <Input id="edit-experience" type="number" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className={errors.experience ? 'border-destructive' : ''} />
                                {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
                            </div>
                            <div>
                                <Label htmlFor="edit-rating">Rating</Label>
                                <Input id="edit-rating" type="number" step="0.1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} className={errors.rating ? 'border-destructive' : ''} />
                                {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleUpdateTrainer} className="flex-1">Update Trainer</Button>
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

            {/* Trainer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-2">
                            {state.trainers.length}
                        </div>
                        <p className="text-muted-foreground">Total Trainers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-2">
                            {(state.trainers.reduce((sum, trainer) => sum + trainer.rating, 0) / (state.trainers.length || 1)).toFixed(1)}
                        </div>
                        <p className="text-muted-foreground">Average Rating</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-2">
                            {(state.trainers.reduce((sum, trainer) => sum + (trainer.experience || 0), 0) / (state.trainers.length || 1)).toFixed(1)} Years
                        </div>
                        <p className="text-muted-foreground">Average Experience</p>
                    </CardContent>
                </Card>
            </div>

            {/* Specializations */}
            <Card>
                <CardHeader>
                    <CardTitle>Specializations Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(state.trainers.map(trainer => trainer.specialization))).map((specialization) => (
                            <Badge key={specialization} variant="secondary" className="text-sm">
                                {specialization}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search trainers by name, specialization, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Trainers Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        All Trainers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Trainer</TableHead>
                                    <TableHead>Specialization</TableHead>
                                    <TableHead>Experience</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTrainers.map((trainer) => (
                                    <TableRow key={trainer.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-primary/10">
                                                    <AvatarImage src={trainer.image !== '/placeholder.svg' ? trainer.image : ''} alt={trainer.name} />
                                                    <AvatarFallback>{trainer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{trainer.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{trainer.specialization}</Badge>
                                        </TableCell>
                                        <TableCell>{trainer.experience} years</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {renderStars(trainer.rating)}
                                                <span className="text-xs text-muted-foreground ml-1">({trainer.rating})</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(trainer.status || 'Active')}>
                                                {trainer.status || 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    {trainer.email}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    {trainer.phone}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(trainer)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteTrainer(trainer.id)}
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

                    {filteredTrainers.length === 0 && (
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No trainers found</h3>
                            <p className="text-muted-foreground">
                                {searchTerm ? 'No trainers match your search criteria.' : 'Start by adding your first trainer.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>



        </div>
    );
};

export default Trainers;
