import express from 'express';
import User from '../models/User.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Apply protect and admin middleware to all routes
router.use(protect);
router.use(admin);

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const createUserSchema = z.object({
    name: z.string().min(2),
    username: z.string().min(2),
    password: z.string().min(6),
    role: z.enum(['admin', 'employee']).default('employee'),
    status: z.enum(['active', 'inactive']).default('active')
});

// Create user (Admin)
router.post('/', async (req, res) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const { name, username, password, role } = validatedData;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, username, password: hashedPassword, role, status: validatedData.status });
        await newUser.save();

        res.status(201).json({
            id: newUser._id,
            name: newUser.name,
            username: newUser.username,
            role: newUser.role,
            status: newUser.status
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
});

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    username: z.string().min(2).optional(),
    role: z.enum(['admin', 'employee']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    password: z.string().min(6).optional()
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const validatedData = updateUserSchema.parse(req.body);
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (validatedData.name) user.name = validatedData.name;
        if (validatedData.username) user.username = validatedData.username;
        if (validatedData.role) user.role = validatedData.role;
        if (validatedData.status) user.status = validatedData.status;
        if (validatedData.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(validatedData.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            role: updatedUser.role,
            status: updatedUser.status
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: error.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent self-deletion
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        // Check if trying to delete the last admin
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last admin user' });
            }
        }

        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
