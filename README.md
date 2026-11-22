# Gym Management System

A comprehensive, full-stack web application designed to manage the day-to-day operations of a modern gym. Built with a robust **Node.js** backend and a dynamic **React** frontend, this system streamlines member management, trainer coordination, class scheduling, and payment tracking with a secure role-based access control system.

---

## 🚀 Key Features

### 📊 **Dashboard & Analytics**
- **Real-time Statistics**: View total members, active trainers, classes today, and monthly revenue at a glance.
- **Visual Analytics**: Interactive charts for Member Growth and Revenue Overview using **Recharts**.
- **Activity Log**: Recent system activities (new signups, payments, updates) powered by a dedicated Activity schema.

### 👥 **Member Management**
- **Full CRUD**: Add, edit, view, and delete members.
- **Search & Filter**: Find members instantly by name, email, or phone.
- **Status Tracking**: Monitor subscription status (Active, Inactive, Expired).
- **Subscription Plans**: Flexible tiering with Basic, Premium, and VIP plans.

### 🏋️ **Trainer Management**
- **Profile Management**: Manage trainer details, specializations, and experience.
- **Rating System**: Track trainer performance ratings.
- **Availability**: Status indicators for active or on-leave trainers.

### 📅 **Classes & Schedule**
- **Class Management**: Schedule classes with instructors, times, and capacity limits.
- **Enrollment Tracking**: Monitor class occupancy and capacity limits.
- **Day Filtering**: View classes for specific days of the week.

### 💳 **Payments & Finance**
- **Transaction Tracking**: Record and monitor member payments.
- **Status Indicators**: Visual cues for **Paid**, **Pending**, or **Failed** payments.
- **Financial Reports**: Statistical cards for total revenue and failed payment totals.

### � **Reports & Export**
- **Distribution Charts**: Visual breakdown of membership plans (Basic vs Premium vs VIP).
- **Status Overview**: Comprehensive view of active/inactive/expired memberships.
- **CSV Export**: Download detailed activity and financial reports for offline analysis.

### �🔐 **Security & User Management**
- **Role-Based Access**: Secure access control for **Admin** and **Employee** roles.
- **User Control**: Administrators can manage system users (Admins and Employees) with protections against deleting the last administrator.
- **JWT Authentication**: Secure login system using JSON Web Tokens.
- **Input Validation**: Strict schema validation using **Zod** across frontend and backend.

### 🎨 **UI / UX Excellence**
- **Modern Design**: Clean, responsive interface built with **Tailwind CSS** and **Shadcn UI**.
- **Dark Mode**: Fully supported dark/light theme switching via `next-themes`.
- **Responsive**: Optimized for flawless performance on desktop, tablet, and mobile devices.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TanStack Query, React Hook Form, Tailwind CSS, Shadcn UI, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Security** | JWT, Bcrypt.js, Zod Validation |
| **Utilities** | Date-fns, Sonner (Toasts), Next Themes |

---

## ⚙️ Setup & Installation

### 1. Backend Setup
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables in a `.env` file:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://127.0.0.1:27017/gym
    JWT_SECRET=your_secret_key
    ```
4.  **Seed the database**: Initialize with default accounts (Clears all existing data):
    ```bash
    npm run seed
    ```
5.  Start the server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup
1.  From the project root:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Access the app at `http://localhost:8080`.

---

## 🔐 Default Credentials (Clean Seed)

After running `npm run seed`, use these credentials to access the system:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Employee** | `employee` | `emp123` |

> [!NOTE]
> The seed script clears all existing data (Members, Trainers, Classes, Payments, Activities) to ensure a clean slate before creating these accounts.

---

## 📂 Project Structure

```text
├── src/                # Frontend Source
│   ├── components/     # UI Components (Shadcn)
│   ├── contexts/       # Global State (AppContext)
│   ├── pages/          # Dashboard, Members, Reports, etc.
│   ├── lib/            # Zod Schemas & Utilities
│   └── hooks/          # Custom Hooks
├── backend/            # Backend Source
│   ├── models/         # Mongoose Schemas (Member, Activity, etc.)
│   ├── routes/         # API Endpoints
│   ├── seed.js         # Database Seeding Script
│   └── server.js       # Express Server Entry
└── vite.config.js      # Proxy & Build Config
```

---
*This project was developed for the Advanced Web Development Final Project.*
