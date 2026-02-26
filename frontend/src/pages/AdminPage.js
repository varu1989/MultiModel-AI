import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, CreditCard, Activity, AlertTriangle, FileText, 
  DollarSign, Loader2, Plus, Minus, Download, RefreshCw 
} from 'lucide-react';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usage, setUsage] = useState([]);
  const [errors, setErrors] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [revenue, setRevenue] = useState(null);
  
  // Grant credits dialog
  const [grantDialog, setGrantDialog] = useState(false);
  const [grantData, setGrantData] = useState({ user_id: '', credits: 0, reason: '' });
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, usageRes, errorsRes, docsRes, subsRes, revenueRes] = await Promise.all([
        adminAPI.users(),
        adminAPI.usage(100),
        adminAPI.errors(100),
        adminAPI.documents(),
        adminAPI.subscriptions(),
        adminAPI.revenue(),
      ]);
      
      setUsers(usersRes.data);
      setUsage(usageRes.data);
      setErrors(errorsRes.data);
      setDocuments(docsRes.data);
      setSubscriptions(subsRes.data);
      setRevenue(revenueRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantCredits = async () => {
    if (!grantData.user_id || grantData.credits === 0) {
      toast.error('Please fill in all fields');
      return;
    }

    setGranting(true);
    try {
      await adminAPI.grantCredits(grantData);
      toast.success(`Credits ${grantData.credits > 0 ? 'granted' : 'deducted'} successfully`);
      setGrantDialog(false);
      setGrantData({ user_id: '', credits: 0, reason: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to update credits');
    } finally {
      setGranting(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users, credits, and system</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatPrice(revenue?.total_revenue || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{revenue?.total_credits_sold || 0}</p>
                <p className="text-sm text-muted-foreground">Credits Sold</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Users</CardTitle>
                <Dialog open={grantDialog} onOpenChange={setGrantDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="grant-credits-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Grant/Deduct Credits
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Grant or Deduct Credits</DialogTitle>
                      <DialogDescription>
                        Enter positive number to grant, negative to deduct
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>User ID</Label>
                        <Input
                          placeholder="Enter user ID"
                          value={grantData.user_id}
                          onChange={(e) => setGrantData({ ...grantData, user_id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Credits</Label>
                        <Input
                          type="number"
                          placeholder="Enter credits"
                          value={grantData.credits}
                          onChange={(e) => setGrantData({ ...grantData, credits: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason (Optional)</Label>
                        <Input
                          placeholder="Enter reason"
                          value={grantData.reason}
                          onChange={(e) => setGrantData({ ...grantData, reason: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setGrantDialog(false)}>Cancel</Button>
                      <Button onClick={handleGrantCredits} disabled={granting}>
                        {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Credits</th>
                      <th className="text-left py-3 px-4">Plan</th>
                      <th className="text-left py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-primary">{user.credits}</td>
                        <td className="py-3 px-4 capitalize">{user.subscription_plan?.replace('_', ' ') || '-'}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Usage Logs</CardTitle>
                <a href={adminAPI.exportUsage()} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {usage.map((log, i) => (
                  <div key={log.id || i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="font-medium capitalize">{log.action}</p>
                      <p className="text-sm text-muted-foreground">User: {log.user_id.slice(0, 8)}...</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary">-{log.credits_used} credits</p>
                      <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="mt-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Error Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No errors logged</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {errors.map((log, i) => (
                    <div key={log.id || i} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-destructive">{log.error_type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">Filename</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Chunks</th>
                      <th className="text-left py-3 px-4">User ID</th>
                      <th className="text-left py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">{doc.filename}</td>
                        <td className="py-3 px-4 uppercase text-xs">{doc.file_type}</td>
                        <td className="py-3 px-4">{doc.chunk_count}</td>
                        <td className="py-3 px-4 text-xs">{doc.user_id.slice(0, 8)}...</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(doc.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="mt-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Subscription History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">Plan</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Credits</th>
                      <th className="text-left py-3 px-4">User ID</th>
                      <th className="text-left py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 capitalize">{sub.plan?.replace('_', ' ')}</td>
                        <td className="py-3 px-4 text-green-500">{formatPrice(sub.amount)}</td>
                        <td className="py-3 px-4 text-primary">+{sub.credits_added}</td>
                        <td className="py-3 px-4 text-xs">{sub.user_id?.slice(0, 8)}...</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {formatDate(sub.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
