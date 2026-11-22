import express from 'express';
import User from '../models/User.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    username: z.string().min(2, 'Username must be at least 2 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// Signup
router.post('/signup', async (req, res) => {
    try {
        const validatedData = signupSchema.parse(req.body);
        const { name, username, password } = validatedData;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({ name, username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({
            message: 'User created successfully',
            user: { id: newUser._id, name: newUser.name, username: newUser.username, role: newUser.role },
            token: generateToken(newUser._id, newUser.role)
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt for:', req.body.username);
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        console.log('User found:', !!user);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({ message: 'Account is inactive. Please contact administrator.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, username: user.username, role: user.role },
            token: generateToken(user._id, user.role)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get current user (protected)
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
});

// Change Password
router.put('/change-password', protect, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // 1. Check if old password is provided (Required check)
        if (!oldPassword) {
            return res.status(400).json({ message: 'Old password is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Check old password (The "Invalid" check)
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        // 3. Validate the rest of the body (Matching, length, etc.)
        const result = changePasswordSchema.safeParse(req.body);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const firstErrorField = Object.keys(fieldErrors)[0];
            return res.status(400).json({ message: fieldErrors[firstErrorField][0] });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
