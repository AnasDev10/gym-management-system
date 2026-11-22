import express from 'express';
import Member from '../models/Member.js';
import Trainer from '../models/Trainer.js';
import Payment from '../models/Payment.js';
import GymClass from '../models/GymClass.js';
import Activity from '../models/Activity.js';

const router = express.Router();

// Get Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const totalMembers = await Member.countDocuments();
        const totalTrainers = await Trainer.countDocuments({ status: 'Active' });
        const totalPayments = await Payment.countDocuments();

        // Calculate total revenue
        const payments = await Payment.find();
        const totalRevenue = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

        // Subscription Stats
        const subscriptionCounts = await Member.aggregate([
            { $group: { _id: "$subscription", count: { $sum: 1 } } }
        ]);

        let mostPopularPlan = null;
        let maxCount = 0;
        const breakdown = {};
        const counts = [];

        subscriptionCounts.forEach(item => {
            if (item._id) {
                breakdown[item._id] = item.count;
                counts.push({ plan: item._id, count: item.count });
                if (item.count > maxCount) {
                    maxCount = item.count;
                }
            }
        });

        // Determine winner
        // Filter plans that have the max count
        const winners = counts.filter(c => c.count === maxCount);

        // Only set mostPopular if there is exactly one winner and maxCount > 0
        if (winners.length === 1 && maxCount > 0) {
            mostPopularPlan = winners[0].plan;
        }

        // Get Today's Classes
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayName = days[new Date().getDay()];

        const todaysClasses = await GymClass.find({
            days: todayName
        }).populate('instructor').sort({ time: 1 });

        res.json({
            totalMembers,
            totalTrainers,
            totalPayments,
            totalRevenue,
            todaysClasses: todaysClasses.map(c => ({
                id: c._id,
                name: c.name,
                instructor: c.instructor?.name || 'No Instructor',
                time: c.time,
                duration: c.duration,
                enrolled: c.enrolled,
                capacity: c.capacity
            })),
            subscriptionStats: {
                mostPopular: mostPopularPlan,
                breakdown
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get Chart Data
router.get('/charts', async (req, res) => {
    try {
        // Aggregation for Monthly Member Growth
        const memberGrowth = await Member.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const growthData = memberGrowth.map(item => ({
            name: months[item._id.month - 1],
            members: item.count
        }));

        // Aggregation for Monthly Revenue
        const revenueAggregation = await Payment.aggregate([
            {
                $match: { status: 'Paid' }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" }
                    },
                    revenue: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const revenueData = revenueAggregation.map(item => ({
            name: months[item._id.month - 1],
            revenue: item.revenue
        }));

        res.json({
            memberGrowth: growthData,
            revenueData: revenueData
        });
    } catch (error) {
        console.error("Dashboard Charts Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get Recent Activity
router.get('/recent', async (req, res) => {
    try {
        // Fetch from the centralized Activity log
        const activities = await Activity.find().sort({ createdAt: -1 }).limit(10);

        // Map to frontend expected format if necessary, though Activity model is designed to match
        const formattedActivities = activities.map(a => ({
            id: a._id,
            action: a.action,
            user: a.user,
            time: a.createdAt,
            type: a.type
        }));

        res.json(formattedActivities);
    } catch (error) {
        console.error("Dashboard Recent Error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
