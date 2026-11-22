import { z } from 'zod';

// Helper for phone validation (exactly 10 digits)
const phoneRegex = /^\d{10}$/;
// Helper for name validation (letters and spaces only, no special chars)
const nameRegex = /^[a-zA-Z\s]+$/;

export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
});

export const signupSchema = z.object({
    name: z.string().min(1, 'Name is required').regex(nameRegex, 'Name can only contain letters and spaces'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm Password is required')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const memberSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').regex(nameRegex, 'Name can only contain letters and spaces'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    phone: z.string().min(1, 'Phone is required').regex(phoneRegex, 'Phone number must be exactly 10 digits'),
    subscription: z.enum(['Basic', 'Premium', 'VIP'], {
        errorMap: () => ({ message: 'Please select a valid subscription plan' })
    }),
    assignedClass: z.string().transform(val => val === "" ? null : val).optional().nullable()
});

export const trainerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').regex(nameRegex, 'Name can only contain letters and spaces'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    phone: z.string().min(1, 'Phone is required').regex(phoneRegex, 'Phone number must be exactly 10 digits'),
    specialization: z.string().min(1, 'Specialization is required').regex(nameRegex, 'Specialization can only contain letters and spaces'),
    experience: z.union([z.string().min(1, 'Experience is required'), z.number()]).transform((val) => Number(val)).refine((val) => !isNaN(val) && val >= 0 && val <= 75, 'Experience must be between 0 and 75 years'),
    rating: z.union([z.string().min(1, 'Rating is required'), z.number()]).transform((val) => Number(val)).refine((val) => !isNaN(val) && val >= 0 && val <= 5, 'Rating must be between 0 and 5'),
    status: z.enum(['Active', 'On Leave', 'Inactive']).default('Active'),
    image: z.string().optional()
});

export const classSchema = z.object({
    name: z.string().min(2, 'Class Name must be at least 2 characters'),
    instructor: z.string().min(1, 'Instructor is required'),
    time: z.string().min(1, 'Time is required').refine(val => val >= "06:00" && val <= "20:00", "Time must be between 06:00 and 20:00"),
    days: z.array(z.string()).min(1, 'Select at least one day'),
    duration: z.union([z.string(), z.number()]).transform((val) => Number(val)).refine((val) => !isNaN(val) && val > 0, 'Duration must be positive'),
    capacity: z.union([z.string(), z.number()])
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val > 0, 'Capacity must be positive')
        .refine((val) => val <= 50, 'Capacity cannot exceed 50')
});

export const paymentSchema = z.object({
    memberId: z.string().min(1, 'Member is required'),
    amount: z.union([z.string(), z.number()]).transform((val) => Number(val)).refine((val) => !isNaN(val) && val > 0, 'Amount must be a positive number'),
    status: z.enum(['Pending', 'Paid', 'Failed'], {
        errorMap: () => ({ message: 'Invalid status' })
    })
});
export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password')
});
