import React, { createContext, useContext, useReducer, useEffect } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    members: [],
    trainers: [],
    classes: [],
    payments: [],
    activities: [],
    dashboardStats: null,
    isLoading: false,
    error: null,
    theme: 'light' // Default theme
};

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_USER':
            if (action.payload) {
                localStorage.setItem('user', JSON.stringify(action.payload));
            } else {
                localStorage.removeItem('user');
            }
            return { ...state, user: action.payload };
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'SET_MEMBERS':
            return { ...state, members: action.payload };
        case 'ADD_MEMBER':
            return { ...state, members: [...state.members, action.payload] };
        case 'UPDATE_MEMBER':
            return {
                ...state,
                members: state.members.map(member =>
                    (member.id === action.payload.id || member._id === action.payload.id) ? action.payload : member
                )
            };
        case 'DELETE_MEMBER':
            return {
                ...state,
                members: state.members.filter(member => member.id !== action.payload && member._id !== action.payload)
            };
        case 'SET_TRAINERS':
            return { ...state, trainers: action.payload };
        case 'ADD_TRAINER':
            return { ...state, trainers: [...state.trainers, action.payload] };
        case 'UPDATE_TRAINER':
            return {
                ...state,
                trainers: state.trainers.map(trainer =>
                    (trainer.id === action.payload.id || trainer._id === action.payload.id) ? action.payload : trainer
                )
            };
        case 'DELETE_TRAINER':
            return {
                ...state,
                trainers: state.trainers.filter(trainer => trainer.id !== action.payload && trainer._id !== action.payload)
            };
        case 'SET_CLASSES':
            return { ...state, classes: action.payload };
        case 'ADD_CLASS':
            return { ...state, classes: [...state.classes, action.payload] };
        case 'UPDATE_CLASS':
            return {
                ...state,
                classes: state.classes.map(c =>
                    (c.id === action.payload.id || c._id === action.payload.id) ? action.payload : c
                )
            };
        case 'DELETE_CLASS':
            return {
                ...state,
                classes: state.classes.filter(c => c.id !== action.payload && c._id !== action.payload)
            };
        case 'SET_PAYMENTS':
            return { ...state, payments: action.payload };
        case 'SET_ACTIVITIES':
            return { ...state, activities: action.payload };
        case 'SET_DASHBOARD_STATS':
            return { ...state, dashboardStats: action.payload };
        case 'ADD_PAYMENT':
            return { ...state, payments: [...state.payments, action.payload] };
        case 'UPDATE_PAYMENT':
            return {
                ...state,
                payments: state.payments.map(p =>
                    (p.id === action.payload.id || p._id === action.payload.id) ? action.payload : p
                )
            };
        case 'DELETE_PAYMENT':
            return {
                ...state,
                payments: state.payments.filter(p => p.id !== action.payload && p._id !== action.payload)
            };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch(`${API_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const user = await res.json();
                        dispatch({ type: 'SET_USER', payload: { ...user, id: user._id } });
                    } else {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        dispatch({ type: 'SET_USER', payload: null });
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                }
            }
        };

        checkAuth();
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const headers = {};
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const [membersRes, trainersRes, classesRes, paymentsRes, activityRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/members`, { headers }),
                fetch(`${API_URL}/api/trainers`, { headers }),
                fetch(`${API_URL}/api/classes`, { headers }),
                fetch(`${API_URL}/api/payments`, { headers }),
                fetch(`${API_URL}/api/dashboard/recent`, { headers }),
                fetch(`${API_URL}/api/dashboard/stats`, { headers })
            ]);

            if (membersRes.ok) {
                const members = await membersRes.json();
                dispatch({ type: 'SET_MEMBERS', payload: members.map(m => ({ ...m, id: m._id })) });
            }
            if (trainersRes.ok) {
                const trainers = await trainersRes.json();
                dispatch({ type: 'SET_TRAINERS', payload: trainers.map(t => ({ ...t, id: t._id })) });
            }
            if (classesRes.ok) {
                const classes = await classesRes.json();
                dispatch({ type: 'SET_CLASSES', payload: classes.map(c => ({ ...c, id: c._id })) });
            }
            if (paymentsRes.ok) {
                const payments = await paymentsRes.json();
                dispatch({ type: 'SET_PAYMENTS', payload: payments.map(p => ({ ...p, id: p._id })) });
            }
            if (activityRes.ok) {
                const activities = await activityRes.json();
                dispatch({ type: 'SET_ACTIVITIES', payload: activities });
            }
            if (statsRes.ok) {
                const stats = await statsRes.json();
                dispatch({ type: 'SET_DASHBOARD_STATS', payload: stats });
            }

        } catch (error) {
            console.error('Failed to fetch data:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const login = async (username, password) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Login failed');

            const user = { ...data.user, id: data.user.id || data.user._id };
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', data.token);
            dispatch({ type: 'SET_USER', payload: user });
            return true;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return false;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        dispatch({ type: 'SET_USER', payload: null });
    };

    const signup = async (name, username, password) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const res = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Signup failed');

            const user = { ...data.user, id: data.user.id || data.user._id };
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', data.token);
            dispatch({ type: 'SET_USER', payload: user });
            return true;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return false;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const addClass = async (classData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/classes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(classData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to add class');

            const newClass = { ...data, id: data._id };
            dispatch({ type: 'ADD_CLASS', payload: newClass });
            fetchData();
            return { success: true };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const addTrainer = async (trainerData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/trainers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(trainerData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to add trainer');

            const newTrainer = { ...data, id: data._id };
            dispatch({ type: 'ADD_TRAINER', payload: newTrainer });
            fetchData();
            return { success: true };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const addPayment = async (paymentData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to add payment');

            const newPayment = { ...data, id: data._id };
            dispatch({ type: 'ADD_PAYMENT', payload: newPayment });
            fetchData();
            return { success: true };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const updatePayment = async (id, paymentData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log(`[AppContext] Updating payment ${id}...`, paymentData);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/payments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData),
            });
            const data = await res.json();
            if (!res.ok) {
                console.error('[AppContext] Update payment failed:', data);
                throw new Error(data.message);
            }

            const updatedPayment = { ...data, id: data._id };
            dispatch({ type: 'UPDATE_PAYMENT', payload: updatedPayment });
            fetchData();
            return { success: true };
        } catch (error) {
            console.error('[AppContext] Error updating payment:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const deletePayment = async (id) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log(`[AppContext] Deleting payment ${id}...`);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/payments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error('[AppContext] Delete payment failed');
                throw new Error('Failed to delete');
            }

            dispatch({ type: 'DELETE_PAYMENT', payload: id });
            fetchData();
            return { success: true };
        } catch (error) {
            console.error('[AppContext] Error deleting payment:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const addMember = async (memberData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(memberData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to add member');

            const newMember = { ...data, id: data._id };
            dispatch({ type: 'ADD_MEMBER', payload: newMember });
            fetchData();
            return { success: true };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const updateMember = async (id, memberData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log(`[AppContext] Updating member ${id}...`, memberData);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/members/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(memberData),
            });
            const data = await res.json();

            if (!res.ok) {
                console.error('[AppContext] Update failed:', data);
                throw new Error(data.message || 'Update failed');
            }

            console.log('[AppContext] Update success:', data);

            const updatedMember = { ...data, id: data._id };
            dispatch({ type: 'UPDATE_MEMBER', payload: updatedMember });
            fetchData();
            return { success: true };
        } catch (error) {
            console.error('[AppContext] Error updating member:', error);
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const deleteMember = async (id) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/members/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete');
            }

            dispatch({ type: 'DELETE_MEMBER', payload: id });
            fetchData();
            return { success: true };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const updateTrainer = async (id, trainerData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/trainers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(trainerData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const updatedTrainer = { ...data, id: data._id };
            dispatch({ type: 'UPDATE_TRAINER', payload: updatedTrainer });
            fetchData();
            return { success: true };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const deleteTrainer = async (id) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/trainers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete');

            dispatch({ type: 'DELETE_TRAINER', payload: id });
            fetchData();
            return true;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return false;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const updateClass = async (id, classData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/classes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(classData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const updatedClass = { ...data, id: data._id };
            dispatch({ type: 'UPDATE_CLASS', payload: updatedClass });
            fetchData();
            return { success: true };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return { success: false, message: error.message };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const deleteClass = async (id) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/classes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete');

            dispatch({ type: 'DELETE_CLASS', payload: id });
            fetchData();
            return true;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            return false;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const toggleTheme = () => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        dispatch({ type: 'SET_THEME', payload: newTheme });

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        dispatch({ type: 'SET_THEME', payload: savedTheme });
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }, []);

    return (
        <AppContext.Provider value={{
            state, dispatch, login, logout, signup,
            addClass, updateClass, deleteClass,
            addTrainer, updateTrainer, deleteTrainer,
            addPayment, updatePayment, deletePayment, addMember, updateMember, deleteMember, toggleTheme
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};