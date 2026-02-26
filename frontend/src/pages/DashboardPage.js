import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { historyAPI, creditsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  Zap, FileText, Code, Search, Mic, Image, Video, 
  TrendingUp, Clock, ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  { icon: FileText, title: 'Write Content', desc: 'Blog, ads, emails', path: '/content', color: 'text-pink-500' },
  { icon: Code, title: 'Generate Code', desc: 'Write, debug, explain', path: '/code', color: 'text-purple-500' },
  { icon: Search, title: 'Research', desc: 'Deep insights', path: '/research', color: 'text-cyan-500' },
  { icon: Image, title: 'Create Image', desc: 'AI generation', path: '/image', color: 'text-orange-500' },
  { icon: Video, title: 'Make Video', desc: 'Text to video', path: '/video', color: 'text-green-500' },
  { icon: Mic, title: 'Audio', desc: 'TTS & STT', path: '/audio', color: 'text-blue-500' },
];

const DashboardPage = () => {
  const { user, credits, refreshCredits } = useAuth();
  const [recentActivity, setRecentActivity] = useState([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [historyRes, creditsRes] = await Promise.all([
        historyAPI.get(10),
        creditsAPI.balance(),
      ]);
      setRecentActivity(historyRes.data);
      setSubscriptionInfo(creditsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      content: FileText,
      code: Code,
      research: Search,
      tts: Mic,
      stt: Mic,
      image: Image,
      video: Video,
    };
    return icons[action] || Zap;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Here's what's happening with your AI studio</p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-white/10 card-hover">
            <CardHeader className="pb-2">
              <CardDescription>Available Credits</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                {credits}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/billing">
                <Button variant="outline" size="sm" className="w-full">
                  Get More Credits
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-white/10 card-hover">
            <CardHeader className="pb-2">
              <CardDescription>Subscription Status</CardDescription>
              <CardTitle className="text-xl">
                {subscriptionInfo?.subscription_active ? (
                  <span className="text-green-500">Active</span>
                ) : (
                  <span className="text-yellow-500">No Active Plan</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptionInfo?.subscription_plan && (
                <p className="text-sm text-muted-foreground">
                  Plan: {subscriptionInfo.subscription_plan.replace('_', ' ')}
                </p>
              )}
              {subscriptionInfo?.subscription_expiry && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires: {new Date(subscriptionInfo.subscription_expiry).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-white/10 card-hover">
            <CardHeader className="pb-2">
              <CardDescription>Recent Generations</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-accent" />
                {recentActivity.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">In the last 7 days</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, i) => (
            <Link key={action.path} to={action.path}>
              <motion.div
                whileHover={{ y: -4 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors cursor-pointer h-full"
              >
                <action.icon className={`w-8 h-8 ${action.color} mb-3`} />
                <h3 className="font-medium text-sm">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Link to="/history">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        
        <Card className="glass border-white/10">
          <CardContent className="p-0">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start generating content to see your history</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {recentActivity.slice(0, 5).map((item, i) => {
                  const Icon = getActionIcon(item.action);
                  return (
                    <div key={item.id || i} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{item.action.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(item.timestamp)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">-{item.credits_used} credits</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
