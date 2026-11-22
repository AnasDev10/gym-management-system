import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Star, Crown, Zap, FileText } from 'lucide-react';

const Reports = () => {
    const { state } = useApp();
    const [popularPlanId, setPopularPlanId] = useState(null);
    const [activities, setActivities] = useState([]);

    React.useEffect(() => {
        const fetchStatsAndActivity = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    fetch('/api/dashboard/stats'),
                    fetch('/api/dashboard/recent')
                ]);

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    if (data.subscriptionStats?.mostPopular) {
                        setPopularPlanId(data.subscriptionStats.mostPopular.toLowerCase());
                    }
                }

                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setActivities(activityData);
                }
            } catch (error) {
                console.error("Failed to fetch reports data:", error);
            }
        };
        fetchStatsAndActivity();
    }, []);

    const plans = [
        {
            id: 'basic',
            name: 'Basic',
            price: 29,
            icon: Zap,
            popular: popularPlanId === 'basic',
            features: [
                'Access to gym equipment',
                'Locker room access',
                'Basic fitness assessment',
                '2 guest passes per month'
            ],
            description: 'Perfect for beginners getting started with fitness'
        },
        {
            id: 'premium',
            name: 'Premium',
            price: 59,
            icon: Star,
            popular: popularPlanId === 'premium',
            features: [
                'Everything in Basic',
                'Unlimited group classes',
                'Personal trainer consultation',
                'Nutrition guidance',
                '5 guest passes per month',
                'Access to premium equipment'
            ],
            description: 'Most popular choice for serious fitness enthusiasts'
        },
        {
            id: 'vip',
            name: 'VIP',
            price: 99,
            icon: Crown,
            popular: popularPlanId === 'vip',
            features: [
                'Everything in Premium',
                'Unlimited personal training',
                'Massage therapy sessions',
                'Private locker',
                'Unlimited guest passes',
                'Priority class booking',
                'Towel service'
            ],
            description: 'Ultimate fitness experience with premium amenities'
        }
    ];

    const getSubscriptionStats = () => {
        const basic = state.members.filter(m => m.subscription === 'Basic').length;
        const premium = state.members.filter(m => m.subscription === 'Premium').length;
        const vip = state.members.filter(m => m.subscription === 'VIP').length;
        const total = state.members.length;

        return { basic, premium, vip, total };
    };

    const stats = getSubscriptionStats();

    const getIconColor = (planId) => {
        switch (planId) {
            case 'basic': return 'text-blue-500';
            case 'premium': return 'text-purple-500';
            case 'vip': return 'text-yellow-500';
            default: return 'text-gray-500';
        }
    };

    const getCardStyle = (isPopular) => {
        if (isPopular) {
            return 'border-purple-200 shadow-lg ring-2 ring-purple-100';
        }
        return 'border-border';
    };

    const handleDownloadReport = () => {
        const totalRevenue = state.payments
            .filter(p => p.status === 'Paid')
            .reduce((sum, p) => sum + p.amount, 0);

        const pendingPayments = state.payments
            .filter(p => p.status === 'Pending')
            .reduce((sum, p) => sum + p.amount, 0);

        const sections = [
            ['--- SUMMARY STATISTICS ---'],
            ['Metric', 'Value'],
            ['Report Generated', new Date().toLocaleString()],
            ['Total Members', stats.total],
            ['Basic Plan', stats.basic],
            ['Premium Plan', stats.premium],
            ['VIP Plan', stats.vip],
            ['Active Members', state.members.filter(m => m.status === 'Active').length],
            ['Inactive Members', state.members.filter(m => m.status === 'Inactive').length],
            ['Expired Members', state.members.filter(m => m.status === 'Expired').length],
            ['Total Revenue', `$${totalRevenue.toFixed(2)}`],
            ['Pending Revenue', `$${pendingPayments.toFixed(2)}`],
            ['Failed Payments Count', state.payments.filter(p => p.status === 'Failed').length],
            [''],
            ['--- RECENT ACTIVITY LOG ---'],
            ['Date', 'User', 'Action', 'Type']
        ];

        const activityRows = activities.map(a => [
            new Date(a.time).toLocaleDateString(),
            a.user,
            a.action,
            a.type
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + sections.map(e => e.join(",")).join("\n")
            + "\n"
            + activityRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `gym_activity_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Gym statistics and activity reports</p>
                </div>
                <Button onClick={handleDownloadReport}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download Full Report
                </Button>
            </div>

            {/* Current Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-primary mb-2">{stats.total}</div>
                        <p className="text-muted-foreground">Total Members</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-blue-500 mb-2">{stats.basic}</div>
                        <p className="text-muted-foreground">Basic Plan</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-purple-500 mb-2">{stats.premium}</div>
                        <p className="text-muted-foreground">Premium Plan</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-2xl font-bold text-yellow-500 mb-2">{stats.vip}</div>
                        <p className="text-muted-foreground">VIP Plan</p>
                    </CardContent>
                </Card>
            </div>

            {/* Plan Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-blue-500" />
                                Basic ({stats.basic} members)
                            </span>
                            <span>{stats.total > 0 ? Math.round((stats.basic / stats.total) * 100) : 0}%</span>
                        </div>
                        <Progress value={stats.total > 0 ? (stats.basic / stats.total) * 100 : 0} className="h-2" />
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-purple-500" />
                                Premium ({stats.premium} members)
                            </span>
                            <span>{stats.total > 0 ? Math.round((stats.premium / stats.total) * 100) : 0}%</span>
                        </div>
                        <Progress value={stats.total > 0 ? (stats.premium / stats.total) * 100 : 0} className="h-2" />
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                VIP ({stats.vip} members)
                            </span>
                            <span>{stats.total > 0 ? Math.round((stats.vip / stats.total) * 100) : 0}%</span>
                        </div>
                        <Progress value={stats.total > 0 ? (stats.vip / stats.total) * 100 : 0} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                        <Card
                            key={plan.id}
                            className={`relative transition-all duration-200 hover:shadow-lg ${getCardStyle(plan.popular)}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-4">
                                <div className={`mx-auto mb-4 w-12 h-12 rounded-full bg-background border-2 flex items-center justify-center ${getIconColor(plan.id)}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <div className="text-3xl font-bold">
                                    ${plan.price}
                                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>


                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Member Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Member Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-500 mb-2">
                                {state.members.filter(m => m.status === 'Active').length}
                            </div>
                            <p className="text-muted-foreground">Active Members</p>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-500 mb-2">
                                {state.members.filter(m => m.status === 'Inactive').length}
                            </div>
                            <p className="text-muted-foreground">Inactive Members</p>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-500 mb-2">
                                {state.members.filter(m => m.status === 'Expired').length}
                            </div>
                            <p className="text-muted-foreground">Expired Memberships</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Reports;
