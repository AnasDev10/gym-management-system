import express from 'express';
import GymClass from '../models/GymClass.js';
import Activity from '../models/Activity.js';
import Member from '../models/Member.js';
import { z } from 'zod';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Validation Schema
const classSchema = z.object({
    name: z.string().min(2, 'Class name is required'),
    instructor: z.string().optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    days: z.array(z.string()).optional(),
    duration: z.number().positive('Duration must be positive'),
    capacity: z.number().positive('Capacity must be positive'),
    enrolled: z.number().min(0).optional(),
});

// Get all classes
router.get('/', async (req, res) => {
    try {
        const classes = await GymClass.find().populate('instructor').sort({ createdAt: -1 });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create class
router.post('/', async (req, res) => {
    try {
        const validatedData = classSchema.parse(req.body);

        // Check for exact duplicate (Name, Time, Days)
        if (validatedData.days && validatedData.days.length > 0) {
            const duplicateClass = await GymClass.findOne({
                name: validatedData.name,
                time: validatedData.time,
                days: { $in: validatedData.days }
            });

            if (duplicateClass) {
                return res.status(400).json({ message: `Class '${validatedData.name}' already exists at ${validatedData.time} on ${duplicateClass.days.join(', ')}` });
            }

            // Check for Instructor Conflict
            const instructorConflict = await GymClass.findOne({
                instructor: validatedData.instructor,
                time: validatedData.time,
                days: { $in: validatedData.days },
                name: { $ne: validatedData.name }
            });

            if (instructorConflict) {
                return res.status(400).json({
                    message: `Instructor is already teaching '${instructorConflict.name}' at ${validatedData.time} on one of these days.`
                });
            }
        }
        const newClass = new GymClass(validatedData);
        const savedClass = await (await newClass.save()).populate('instructor');

        await Activity.create({
            action: 'Class Created',
            user: savedClass.name,
            type: 'class',
            relatedId: savedClass._id
        });

        res.status(201).json(savedClass);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(400).json({ message: error.message });
    }
});

// Update class
router.put('/:id', async (req, res) => {
    try {
        const validatedData = classSchema.partial().parse(req.body);

        const oldClass = await GymClass.findById(req.params.id);
        if (!oldClass) return res.status(404).json({ message: 'Class not found' });

        // Check for exact duplicate
        if (validatedData.name && validatedData.time && validatedData.days) {
            const duplicateClass = await GymClass.findOne({
                name: validatedData.name,
                time: validatedData.time,
                days: { $in: validatedData.days },
                _id: { $ne: req.params.id }
            });

            if (duplicateClass) {
                return res.status(400).json({ message: `Class '${validatedData.name}' already exists at ${validatedData.time}` });
            }
        }

        const updatedClass = await GymClass.findByIdAndUpdate(
            req.params.id,
            validatedData,
            { new: true }
        ).populate('instructor');

        // 2. CASCADE: Name changes no longer need cascading updates as Member refs by ObjectId

        await Activity.create({
            action: 'Class Updated',
            user: updatedClass.name,
            type: 'class',
            relatedId: updatedClass._id
        });

        res.json(updatedClass);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(400).json({ message: error.message });
    }
});

// Delete class
router.delete('/:id', async (req, res) => {
    try {
        const deletedClass = await GymClass.findByIdAndDelete(req.params.id);
        if (!deletedClass) return res.status(404).json({ message: 'Class not found' });

        // CASCADE: Clear class ref for members
        await Member.updateMany(
            { assignedClass: deletedClass._id },
            { assignedClass: null }
        );

        await Activity.create({
            action: 'Class Deleted',
            user: deletedClass.name,
            type: 'class',
            relatedId: deletedClass._id
        });

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
