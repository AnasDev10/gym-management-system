import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, unique: true },
    joinDate: { type: Date, default: Date.now },
    subscription: { type: String, enum: ['Basic', 'Premium', 'VIP'], default: 'Basic' },
    status: { type: String, enum: ['Active', 'Inactive', 'Expired'], default: 'Active' },
    assignedClass: { type: mongoose.Schema.Types.ObjectId, ref: 'GymClass' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Member', memberSchema);
