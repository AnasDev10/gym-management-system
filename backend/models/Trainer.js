import mongoose from 'mongoose';

const trainerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    specialization: { type: String },
    experience: { type: Number },
    rating: { type: Number, default: 0 },
    image: { type: String },
    status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Trainer', trainerSchema);
