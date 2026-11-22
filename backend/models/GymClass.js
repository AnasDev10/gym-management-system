import mongoose from 'mongoose';

const gymClassSchema = new mongoose.Schema({
    name: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
    time: { type: String, required: true }, // e.g., "07:00"
    days: [{ type: String }], // e.g. ["Mon", "Wed"]
    duration: { type: Number, required: true }, // in minutes
    capacity: { type: Number, required: true },
    enrolled: { type: Number, default: 0 },
    date: { type: Date }, // specific date if applicable, or just day of week logic
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('GymClass', gymClassSchema);
