import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Zap, ArrowRight, FileText, Code, Search, Mic, Image, Video, Sparkles } from 'lucide-react';

const features = [
  { icon: FileText, title: 'Content Generator', desc: 'Blogs, Ads, Emails, Social' },
  { icon: Code, title: 'Code Generator', desc: 'Write, Debug, Explain, Test' },
  { icon: Search, title: 'Research Expert', desc: 'Insights, Risks, Actions' },
  { icon: Mic, title: 'Audio Generator', desc: 'Text-to-Speech & STT' },
  { icon: Image, title: 'Image Generator', desc: 'Create & Edit Images' },
  { icon: Video, title: 'Video Generator', desc: 'AI-Powered Videos' },
];

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signup(signupData.email, signupData.password, signupData.name);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      {/* Hero glow */}
      <div className="absolute inset-0 hero-glow" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 md:px-12 lg:px-24 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl font-heading">JaipurEyeVision Studio</span>
          </div>
        </header>

        {/* Main */}
        <main className="px-6 md:px-12 lg:px-24 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">AI-Powered Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6">
                Create with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Limitless AI
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Generate content, code, research, audio, images, and videos with our multimodal AI platform.
                Powered by advanced language models.
              </p>

              {/* Features grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {features.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors"
                  >
                    <feature.icon className="w-6 h-6 text-primary mb-2" />
                    <h3 className="font-medium text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right - Auth */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass border-white/10 shadow-2xl max-w-md mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Get Started</CardTitle>
                  <CardDescription>Sign in or create an account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                      <TabsTrigger value="signup" data-testid="signup-tab">Sign Up</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            required
                            data-testid="login-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                            data-testid="login-password"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full glow-primary"
                          disabled={isLoading}
                          data-testid="login-submit"
                        >
                          {isLoading ? 'Signing in...' : 'Sign In'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Name</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="John Doe"
                            value={signupData.name}
                            onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                            required
                            data-testid="signup-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupData.email}
                            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                            required
                            data-testid="signup-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={signupData.password}
                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            required
                            data-testid="signup-password"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full glow-primary"
                          disabled={isLoading}
                          data-testid="signup-submit"
                        >
                          {isLoading ? 'Creating account...' : 'Create Account'}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
