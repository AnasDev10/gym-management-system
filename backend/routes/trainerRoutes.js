import express from 'express';
import Trainer from '../models/Trainer.js';
import Activity from '../models/Activity.js';
import GymClass from '../models/GymClass.js';
import { z } from 'zod';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Validation Schema
const trainerSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Phone is required'),
    specialization: z.string().optional(),
    experience: z.number().min(0).optional(),
    rating: z.number().min(0).max(5).optional(),
    status: z.enum(['Active', 'On Leave', 'Inactive']).optional().default('Active'),
    image: z.string().optional().or(z.literal('')),
});

// Get all trainers
router.get('/', async (req, res) => {
    try {
        const trainers = await Trainer.find().sort({ createdAt: -1 });
        res.json(trainers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create trainer
router.post('/', async (req, res) => {
    try {
        const validatedData = trainerSchema.parse(req.body);
        const newTrainer = new Trainer(validatedData);
        const savedTrainer = await newTrainer.save();

        await Activity.create({
            action: 'Trainer Added',
            user: savedTrainer.name,
            type: 'trainer',
            relatedId: savedTrainer._id
        });

        res.status(201).json(savedTrainer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Update trainer
router.put('/:id', async (req, res) => {
    try {
        const validatedData = trainerSchema.partial().parse(req.body);

        const oldTrainer = await Trainer.findById(req.params.id);
        if (!oldTrainer) return res.status(404).json({ message: 'Trainer not found' });

        const updatedTrainer = await Trainer.findByIdAndUpdate(
            req.params.id,
            validatedData,
            { new: true }
        );

        // 2. CASCADE: Name changes no longer need cascading updates as GymClass refs by ObjectId

        await Activity.create({
            action: 'Trainer Updated',
            user: updatedTrainer.name,
            type: 'trainer',
            relatedId: updatedTrainer._id
        });

        res.json(updatedTrainer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Delete trainer
router.delete('/:id', async (req, res) => {
    try {
        const deletedTrainer = await Trainer.findByIdAndDelete(req.params.id);
        if (!deletedTrainer) return res.status(404).json({ message: 'Trainer not found' });

        // CASCADE: Clear instructor ref in gym classes
        await GymClass.updateMany(
            { instructor: deletedTrainer._id },
            { instructor: null }
        );

        await Activity.create({
            action: 'Trainer Deleted',
            user: deletedTrainer.name,
            type: 'trainer',
            relatedId: deletedTrainer._id
        });

        res.json({ message: 'Trainer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
