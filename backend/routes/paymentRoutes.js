import express from 'express';
import Payment from '../models/Payment.js';
import Activity from '../models/Activity.js';
import { z } from 'zod';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.get('/', async (req, res) => {
    try {
        const payments = await Payment.find().populate('memberId').sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


const paymentSchema = z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    amount: z.union([z.string(), z.number()])
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val >= 0, 'Amount must be positive'),
    date: z.string().or(z.date()).optional(),
    status: z.enum(['Paid', 'Pending', 'Failed']).default('Pending'),
});

router.post('/', async (req, res) => {
    try {
        const validatedData = paymentSchema.parse(req.body);

        // Check for duplicate payment in the same month
        const paymentDate = validatedData.date ? new Date(validatedData.date) : new Date();
        const startOfMonth = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1);
        const endOfMonth = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const existingPayment = await Payment.findOne({
            memberId: validatedData.memberId,
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            },
            status: { $in: ['Paid', 'Pending'] }
        });

        if (existingPayment) {
            return res.status(400).json({ message: 'Payment already exists for this month' });
        }
        const newPayment = new Payment(validatedData);
        const savedPayment = await (await newPayment.save()).populate('memberId');

        await Activity.create({
            action: 'Payment Received',
            user: savedPayment.memberId?.name || 'Unknown',
            details: `Amount: ${savedPayment.amount}`,
            type: 'payment',
            relatedId: savedPayment._id
        });

        res.status(201).json(savedPayment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(400).json({ message: error.message });
    }
});

// Update payment
router.put('/:id', async (req, res) => {
    console.log(`[API] PUT /payments/${req.params.id}`, req.body);
    try {
        const validatedData = paymentSchema.partial().parse(req.body);
        const updatedPayment = await Payment.findByIdAndUpdate(
            req.params.id,
            validatedData,
            { new: true }
        ).populate('memberId');

        if (!updatedPayment) {
            console.log(`[API] Payment not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Payment not found' });
        }
        console.log('[API] Payment updated:', updatedPayment._id);

        await Activity.create({
            action: 'Payment Updated',
            user: updatedPayment.memberId?.name || 'Unknown',
            details: `Amount: ${updatedPayment.amount}, Status: ${updatedPayment.status}`,
            type: 'payment',
            relatedId: updatedPayment._id
        });

        res.json(updatedPayment);
    } catch (error) {
        console.error('[API] Update payment error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(400).json({ message: error.message });
    }
});

// Delete payment
router.delete('/:id', async (req, res) => {
    console.log(`[API] DELETE /payments/${req.params.id}`);
    try {
        const deletedPayment = await Payment.findByIdAndDelete(req.params.id).populate('memberId');
        if (!deletedPayment) {
            console.log(`[API] Payment not found for delete: ${req.params.id}`);
            return res.status(404).json({ message: 'Payment not found' });
        }
        console.log('[API] Payment deleted successfully');

        await Activity.create({
            action: 'Payment Deleted',
            user: deletedPayment.memberId?.name || 'Unknown',
            type: 'payment',
            relatedId: deletedPayment._id
        });

        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('[API] Delete payment error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
