import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    action: { type: String, required: true }, // e.g., "Member Added", "Class Updated"
    user: { type: String, required: true }, // e.g., Member Name, or "System"
    details: { type: String }, // Optional extra info
    type: { type: String, enum: ['member', 'trainer', 'class', 'payment'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, refPath: 'type' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Activity', activitySchema);
