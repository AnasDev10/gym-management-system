import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Member from './models/Member.js';
import Trainer from './models/Trainer.js';
import GymClass from './models/GymClass.js';
import Payment from './models/Payment.js';
import Activity from './models/Activity.js';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym');
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Member.deleteMany({});
        await Trainer.deleteMany({});
        await GymClass.deleteMany({});
        await Payment.deleteMany({});
        await Activity.deleteMany({});
        console.log('Cleared existing data (Users, Members, Trainers, Classes, Payments, Activities).');

        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const employeePassword = await bcrypt.hash('emp123', salt);

        // Seed Users
        console.log('Seeding users...');
        const users = await User.insertMany([
            { name: 'Admin User', username: 'admin', password: adminPassword, role: 'admin' },
            { name: 'Employee User', username: 'employee', password: employeePassword, role: 'employee' }
        ]);
        console.log('Admin and Employee users seeded successfully.');

        console.log('Database seeded with default accounts successfully!');

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error.name);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error on field "${key}": ${error.errors[key].message}`);
            });
        } else {
            console.error(error);
        }
        process.exit(1);
    }
};

seedData();
