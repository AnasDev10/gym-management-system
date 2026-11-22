import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarIcon, Clock, Users, User, MapPin, Plus, Edit, Trash2, Search } from 'lucide-react';
import { classSchema } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

const Classes = () => {
    const { toast } = useToast();
    const { state, addClass, updateClass, deleteClass } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentClass, setCurrentClass] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        instructor: '',
        time: '',
        days: [],
        duration: '',
        capacity: ''
    });
    const [errors, setErrors] = useState({});

    const filteredClasses = state.classes.filter(gymClass =>
        gymClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gymClass.instructor?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validateForm = () => {
        const result = classSchema.safeParse(formData);
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

    const getAvailabilityColor = (enrolled, capacity) => {
        const percentage = (enrolled / capacity) * 100;
        if (percentage >= 90) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    };

    const getAvailabilityText = (enrolled, capacity) => {
        const remaining = capacity - enrolled;
        if (remaining === 0) return 'Full';
        if (remaining <= 3) return `${remaining} spots left`;
        return 'Available';
    };

    // Dynamic weekly schedule
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Generate time slots based on existing classes + default working hours
    const generateTimeSlots = () => {
        const defaultSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
        const classTimes = state.classes.map(c => c.time);
        const allTimes = new Set([...defaultSlots, ...classTimes]);
        return Array.from(allTimes).sort();
    };

    const timeSlots = generateTimeSlots();

    const getClassForSlot = (day, time) => {
        return state.classes.find(c =>
            c.days && c.days.includes(day) && c.time === time
        );
    };

    const checkScheduleConflict = (newClass, excludeId = null) => {
        const newStart = new Date(`2000-01-01T${newClass.time}`);
        const newEnd = new Date(newStart.getTime() + newClass.duration * 60000);

        for (const day of newClass.days) {
            const conflict = state.classes.find(existingClass => {
                const idMatch = existingClass.id === excludeId || existingClass._id === excludeId;
                if (idMatch) return false;
                if (!existingClass.days.includes(day)) return false;

                const existingStart = new Date(`2000-01-01T${existingClass.time}`);
                const existingEnd = new Date(existingStart.getTime() + existingClass.duration * 60000);

                return (newStart < existingEnd && newEnd > existingStart);
            });

            if (conflict) {
                return {
                    conflict: true,
                    message: `Conflict with "${conflict.name}" on ${day} at ${conflict.time}`
                };
            }
        }
        return { conflict: false };
    };

    const handleAddClass = async () => {
        if (!validateForm()) return;

        const conflictCheck = checkScheduleConflict({
            ...formData,
            duration: parseInt(formData.duration)
        });

        if (conflictCheck.conflict) {
            setErrors({ ...errors, time: conflictCheck.message, days: conflictCheck.message });
            toast({ title: "Schedule Conflict", description: conflictCheck.message, variant: "destructive" });
            return;
        }

        const result = await addClass({
            ...formData,
            duration: parseInt(formData.duration),
            capacity: parseInt(formData.capacity),
            enrolled: 0
        });
        if (result.success) {
            toast({ title: "Class added", description: "New class created successfully." });
            setIsAddDialogOpen(false);
            setFormData({ name: '', instructor: '', time: '', days: [], duration: '', capacity: '' });
            setErrors({});
        } else {
            toast({ title: "Error", description: result.message || "Failed to add class", variant: "destructive" });
        }
    };

    const handleEditClick = (gymClass) => {
        setCurrentClass(gymClass);
        setFormData({
            name: gymClass.name,
            instructor: gymClass.instructor?._id || gymClass.instructor || '',
            time: gymClass.time,
            days: gymClass.days || [],
            duration: gymClass.duration,
            capacity: gymClass.capacity
        });
        setErrors({});
        setIsEditDialogOpen(true);
    };

    const handleUpdateClass = async () => {
        if (!currentClass) return;
        if (!validateForm()) return;

        const conflictCheck = checkScheduleConflict({
            ...formData,
            duration: parseInt(formData.duration)
        }, currentClass.id || currentClass._id);

        if (conflictCheck.conflict) {
            setErrors({ ...errors, time: conflictCheck.message, days: conflictCheck.message });
            toast({ title: "Schedule Conflict", description: conflictCheck.message, variant: "destructive" });
            return;
        }

        const result = await updateClass(currentClass.id || currentClass._id, {
            ...formData,
            duration: parseInt(formData.duration),
            capacity: parseInt(formData.capacity)
        });
        if (result.success) {
            toast({ title: "Class updated", description: "Class details updated successfully." });
            setIsEditDialogOpen(false);
            setCurrentClass(null);
            setFormData({ name: '', instructor: '', time: '', days: [], duration: '', capacity: '' });
            setErrors({});
        } else {
            toast({ title: "Error", description: result.message || "Failed to update class", variant: "destructive" });
        }
    };

    const handleDeleteClass = async (id) => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            await deleteClass(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Classes & Schedule</h1>
                    <p className="text-muted-foreground">Manage gym classes and view the weekly schedule</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => {
                            setFormData({ name: '', instructor: '', time: '', days: [], duration: '', capacity: '' });
                            setErrors({});
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Class
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Class</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="add-name">Class Name</Label>
                                <Input id="add-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? 'border-destructive' : ''} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-instructor">Instructor</Label>
                                <Select value={formData.instructor} onValueChange={(value) => setFormData({ ...formData, instructor: value })}>
                                    <SelectTrigger className={errors.instructor ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Select instructor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {state.trainers.filter(t => t.status === 'Active' || t.status === 'On Leave').map(trainer => (
                                            <SelectItem key={trainer.id || trainer._id} value={trainer.id || trainer._id}>{trainer.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.instructor && <p className="text-sm text-destructive">{errors.instructor}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-time">Time</Label>
                                <Input
                                    id="add-time"
                                    type="time"
                                    min="06:00"
                                    max="20:00"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className={errors.time ? 'border-destructive' : ''}
                                />
                                {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                            </div>

                            <div>
                                <Label>Days</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {weekDays.map(day => (
                                        <div key={day}
                                            className={`border rounded-md px-3 py-1 cursor-pointer text-sm transition-colors ${formData.days.includes(day)
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'hover:bg-muted'
                                                }`}
                                            onClick={() => {
                                                const currentDays = formData.days;
                                                const updatedDays = currentDays.includes(day)
                                                    ? currentDays.filter(d => d !== day)
                                                    : [...currentDays, day];
                                                setFormData({ ...formData, days: updatedDays });
                                            }}
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                {errors.days && <p className="text-sm text-destructive">{errors.days}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-duration">Duration (minutes)</Label>
                                <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                                    <SelectTrigger className={errors.duration ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="45">45 minutes</SelectItem>
                                        <SelectItem value="60">60 minutes</SelectItem>
                                        <SelectItem value="90">90 minutes</SelectItem>
                                        <SelectItem value="120">120 minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                            </div>
                            <div>
                                <Label htmlFor="add-capacity">Capacity</Label>
                                <Input id="add-capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className={errors.capacity ? 'border-destructive' : ''} />
                                {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleAddClass} className="flex-1">Add Class</Button>
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
                            <DialogTitle>Edit Class</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Class Name</Label>
                                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={errors.name ? 'border-destructive' : ''} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="edit-instructor">Instructor</Label>
                                <Select value={formData.instructor} onValueChange={(value) => setFormData({ ...formData, instructor: value })}>
                                    <SelectTrigger className={errors.instructor ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Select instructor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {state.trainers.map(trainer => (
                                            <SelectItem key={trainer.id || trainer._id} value={trainer.id || trainer._id}>{trainer.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.instructor && <p className="text-sm text-destructive">{errors.instructor}</p>}
                            </div>
                            <div>
                                <Label htmlFor="edit-time">Time</Label>
                                <Input
                                    id="edit-time"
                                    type="time"
                                    min="06:00"
                                    max="20:00"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className={errors.time ? 'border-destructive' : ''}
                                />
                                {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                            </div>

                            <div>
                                <Label>Days</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {weekDays.map(day => (
                                        <div key={day}
                                            className={`border rounded-md px-3 py-1 cursor-pointer text-sm transition-colors ${formData.days.includes(day)
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'hover:bg-muted'
                                                }`}
                                            onClick={() => {
                                                const currentDays = formData.days;
                                                const updatedDays = currentDays.includes(day)
                                                    ? currentDays.filter(d => d !== day)
                                                    : [...currentDays, day];
                                                setFormData({ ...formData, days: updatedDays });
                                            }}
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                                <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                                    <SelectTrigger className={errors.duration ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="45">45 minutes</SelectItem>
                                        <SelectItem value="60">60 minutes</SelectItem>
                                        <SelectItem value="90">90 minutes</SelectItem>
                                        <SelectItem value="120">120 minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                            </div>
                            <div>
                                <Label htmlFor="edit-capacity">Capacity</Label>
                                <Input id="edit-capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className={errors.capacity ? 'border-destructive' : ''} />
                                {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleUpdateClass} className="flex-1">Update Class</Button>
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

            {/* Class Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-2">
                            {state.classes.length}
                        </div>
                        <p className="text-muted-foreground">Classes Today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-2">
                            {state.classes.reduce((sum, c) => sum + c.enrolled, 0)}
                        </div>
                        <p className="text-muted-foreground">Total Participants</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-2">
                            {Math.round((state.classes.reduce((sum, c) => sum + (c.enrolled / (c.capacity || 1)), 0) / (state.classes.length || 1)) * 100)}%
                        </div>
                        <p className="text-muted-foreground">Average Capacity</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search classes by name or instructor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Today's Classes Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Today's Classes & All Classes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Class Name</TableHead>
                                    <TableHead>Instructor</TableHead>
                                    <TableHead>Schedule</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClasses.map((gymClass) => (
                                    <TableRow key={gymClass.id || gymClass._id}>
                                        <TableCell className="font-medium">{gymClass.name}</TableCell>
                                        <TableCell>{gymClass.instructor?.name || 'No Instructor'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">{gymClass.time}</span>
                                                <span>{gymClass.days ? gymClass.days.join(', ') : 'No days set'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{gymClass.duration} mins</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs">{gymClass.enrolled}/{gymClass.capacity}</span>
                                                <div className="w-16 bg-muted rounded-full h-1.5">
                                                    <div
                                                        className="bg-primary h-1.5 rounded-full"
                                                        style={{ width: `${(gymClass.enrolled / gymClass.capacity) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getAvailabilityColor(gymClass.enrolled, gymClass.capacity)}>
                                                {getAvailabilityText(gymClass.enrolled, gymClass.capacity)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditClick(gymClass)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClass(gymClass.id || gymClass._id)}
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

            {/* Weekly Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Header */}
                            <div className="grid grid-cols-8 gap-2 mb-4">
                                <div className="p-2 font-medium text-center">Time</div>
                                {weekDays.map(day => (
                                    <div key={day} className="p-2 font-medium text-center border-b">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Time slots */}
                            <div className="space-y-2">
                                {timeSlots.map(time => (
                                    <div key={time} className="grid grid-cols-8 gap-2">
                                        <div className="p-2 text-sm text-muted-foreground text-center font-medium">
                                            {time}
                                        </div>
                                        {weekDays.map(day => {
                                            const classInfo = getClassForSlot(day, time);
                                            return (
                                                <div key={`${day}-${time}`} className="min-h-[60px]">
                                                    {classInfo ? (
                                                        <div
                                                            className="bg-primary/10 border border-primary/20 rounded-lg p-2 h-full hover:bg-primary/20 transition-colors cursor-pointer"
                                                            onClick={() => handleEditClick(classInfo)}
                                                        >
                                                            <div className="text-xs font-medium text-primary">
                                                                {classInfo.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {classInfo.instructor?.name || 'No Instructor'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {classInfo.enrolled}/{classInfo.capacity}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="border-2 border-dashed border-muted rounded-lg p-2 h-full hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center">
                                                            <span className="text-xs text-muted-foreground">+</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Classes;
