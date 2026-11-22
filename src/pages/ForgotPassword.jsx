import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Dumbbell, Mail } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Email is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email');
            return;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitted(true);
        toast({
            title: "Reset link sent!",
            description: "Check your email for password reset instructions.",
        });
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <Mail className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-2xl">Check your email</CardTitle>
                        <CardDescription>
                            We've sent a password reset link to {email}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setIsSubmitted(false)}
                            className="w-full"
                        >
                            Try different email
                        </Button>
                    </CardContent>

                    <CardFooter>
                        <Link to="/login" className="w-full">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <Dumbbell className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email and we'll send you a reset link
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                className={error ? 'border-destructive' : ''}
                            />
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full">
                            Send Reset Link
                        </Button>

                        <Link to="/login" className="w-full">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Button>
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default ForgotPassword;
