import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Calendar, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
    const { state } = useApp();
    const navigate = useNavigate();

    const [chartData, setChartData] = React.useState({
        growthData: [],
        revenueData: []
    });

    const recentActivities = state.activities || [];
    const todaysClasses = state.dashboardStats?.todaysClasses || [];

    // Define stats AFTER state hooks so todaysClasses is defined
    const stats = [
        {
            title: 'Total Members',
            value: state.members?.length || 0,
            icon: Users,
            description: 'Active members'
        },
        {
            title: 'Active Trainers',
            value: state.trainers?.filter(t => t.status === 'Active').length || 0,
            icon: UserCheck,
            description: 'Qualified coaches'
        },
        {
            title: 'Classes Today',
            value: todaysClasses?.length || 0,
            icon: Calendar,
            description: 'Scheduled sessions'
        },
        {
            title: 'Monthly Revenue',
            value: `$${(state.payments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0)}`,
            icon: DollarSign,
            description: 'Gross income'
        }
    ];

    React.useEffect(() => {
        console.log("Dashboard mounted, fetching chart data...");
        const fetchChartData = async () => {
            try {
                const chartsRes = await fetch('/api/dashboard/charts', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                if (chartsRes.ok) {
                    const data = await chartsRes.json();
                    setChartData({
                        growthData: data.memberGrowth || [],
                        revenueData: data.revenueData || []
                    });
                }
            } catch (error) {
                console.error('Failed to fetch chart data:', error);
            }
        };

        fetchChartData();
    }, []);

    const { growthData, revenueData } = chartData;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome back, {state.user?.name}!
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Here's what's happening at your gym today.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className="transition-all duration-200 hover:shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {stat.title}
                                        </p>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {stat.description}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Member Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" className="text-sm text-muted-foreground" />
                                <YAxis className="text-sm text-muted-foreground" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                />
                                <Area type="monotone" dataKey="members" stroke="#8884d8" fillOpacity={1} fill="url(#colorMembers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" className="text-sm text-muted-foreground" />
                                <YAxis className="text-sm text-muted-foreground" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                    cursor={{ fill: 'var(--muted)' }}
                                />
                                <Bar dataKey="revenue" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{activity.action}</p>
                                        <p className="text-xs text-muted-foreground">{activity.user}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(activity.time).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => navigate('/members')} className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors group">
                                <Users className="h-6 w-6 text-muted-foreground group-hover:text-primary mx-auto mb-2" />
                                <p className="text-sm font-medium">Add Member</p>
                            </button>
                            <button onClick={() => navigate('/classes')} className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors group">
                                <Calendar className="h-6 w-6 text-muted-foreground group-hover:text-primary mx-auto mb-2" />
                                <p className="text-sm font-medium">Schedule Class</p>
                            </button>
                            <button onClick={() => navigate('/trainers')} className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors group">
                                <UserCheck className="h-6 w-6 text-muted-foreground group-hover:text-primary mx-auto mb-2" />
                                <p className="text-sm font-medium">Add Trainer</p>
                            </button>
                            <button onClick={() => navigate('/payments')} className="p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors group">
                                <DollarSign className="h-6 w-6 text-muted-foreground group-hover:text-primary mx-auto mb-2" />
                                <p className="text-sm font-medium">Process Payment</p>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Classes */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Classes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {todaysClasses.length > 0 ? (
                            todaysClasses.map((gymClass) => (
                                <div key={gymClass.id} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <h3 className="font-medium">{gymClass.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Instructor: {gymClass.instructor} • {gymClass.time} • {gymClass.duration} min
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {gymClass.enrolled}/{gymClass.capacity} enrolled
                                        </p>
                                        <div className="w-24 bg-muted rounded-full h-2 mt-1">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(gymClass.enrolled / gymClass.capacity) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No classes scheduled for today.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
