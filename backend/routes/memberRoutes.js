import express from 'express';
import Member from '../models/Member.js';
import Activity from '../models/Activity.js';
import Payment from '../models/Payment.js';
import GymClass from '../models/GymClass.js';
import { z } from 'zod';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

const SUBSCRIPTION_PRICES = {
    'Basic': 29,
    'Premium': 59,
    'VIP': 99
};

// Get all members
router.get('/', async (req, res) => {
    try {
        const members = await Member.find().populate('assignedClass').sort({ createdAt: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const memberSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    // Phone regex to match frontend
    phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number format'),
    subscription: z.string().min(1, 'Subscription is required'),
    joinDate: z.string().or(z.date()).optional(), // Accommodate string or date object
    status: z.enum(['Active', 'Inactive', 'Expired']).optional(),
    assignedClass: z.string().transform(val => val === "" ? null : val).optional().nullable()
});

// Create member
router.post('/', async (req, res) => {
    try {
        const validatedData = memberSchema.parse(req.body);
        const newMember = new Member(validatedData);
        const savedMember = await (await newMember.save()).populate('assignedClass');

        // 1. CASCADE: Increment enrolled count for class
        if (savedMember.assignedClass) {
            await GymClass.findByIdAndUpdate(
                savedMember.assignedClass,
                { $inc: { enrolled: 1 } }
            );
        }

        // Auto-generate initial payment
        const amount = SUBSCRIPTION_PRICES[savedMember.subscription] || 0;
        if (amount > 0) {
            const newPayment = await Payment.create({
                memberId: savedMember._id,
                amount: amount,
                date: savedMember.joinDate || new Date(),
                status: 'Pending'
            });

            // Log Payment Activity
            await Activity.create({
                action: 'Payment Generated (Auto)',
                user: 'System',
                details: `Auto-generated bill for ${savedMember.subscription} Plan`,
                type: 'payment',
                relatedId: newPayment._id
            });
        }

        await Activity.create({
            action: 'New Member Joined',
            user: savedMember.name,
            type: 'member',
            relatedId: savedMember._id
        });

        res.status(201).json(savedMember);
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

// Update member
router.put('/:id', async (req, res) => {
    try {
        const validatedData = memberSchema.partial().parse(req.body);

        const oldMember = await Member.findById(req.params.id);
        if (!oldMember) return res.status(404).json({ message: 'Member not found' });

        const updatedMember = await Member.findByIdAndUpdate(
            req.params.id,
            validatedData,
            { new: true }
        ).populate('assignedClass');

        // 1. CASCADE: If class changed, update enrollment counts
        const oldClassId = oldMember.assignedClass?.toString();
        const newClassId = updatedMember.assignedClass?._id?.toString() || updatedMember.assignedClass?.toString();

        if (validatedData.assignedClass !== undefined && newClassId !== oldClassId) {
            // Decrement old class
            if (oldMember.assignedClass) {
                await GymClass.findByIdAndUpdate(
                    oldMember.assignedClass,
                    { $inc: { enrolled: -1 } }
                );
            }
            // Increment new class
            if (updatedMember.assignedClass) {
                await GymClass.findByIdAndUpdate(
                    updatedMember.assignedClass,
                    { $inc: { enrolled: 1 } }
                );
            }
        }

        // 2. CASCADE: Name change logic doesn't need to update payments anymore as memberId is populated
        if (validatedData.name && validatedData.name !== oldMember.name) {
            // No need to update many, payment.memberId.name will reflect the change automatically
        }

        await Activity.create({
            action: 'Member Updated',
            user: updatedMember.name,
            type: 'member',
            relatedId: updatedMember._id
        });

        res.json(updatedMember);
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

// Delete member
router.delete('/:id', async (req, res) => {
    try {
        // Check for any payments that are NOT 'Paid'
        const unpaidPayments = await Payment.countDocuments({
            memberId: req.params.id,
            status: { $ne: 'Paid' }
        });

        if (unpaidPayments > 0) {
            return res.status(400).json({
                message: "Cannot delete member. All payments must be paid before deletion."
            });
        }

        // Deleting all associated 'Paid' payments before deleting the member
        await Payment.deleteMany({ memberId: req.params.id });

        const deletedMember = await Member.findByIdAndDelete(req.params.id);
        if (!deletedMember) return res.status(404).json({ message: 'Member not found' });

        // CASCADE: Decrement class enrollment
        if (deletedMember.assignedClass) {
            await GymClass.findByIdAndUpdate(
                deletedMember.assignedClass,
                { $inc: { enrolled: -1 } }
            );
        }

        await Activity.create({
            action: 'Member Deleted',
            user: deletedMember.name,
            type: 'member',
            relatedId: deletedMember._id
        });

        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
