import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { subscriptionAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { CreditCard, Zap, Check, Loader2, Crown, Sparkles } from 'lucide-react';

const BillingPage = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await subscriptionAPI.plans();
      setPlans(response.data);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setProcessingPlan(planId);
    try {
      // Create order
      const orderResponse = await subscriptionAPI.create({ plan: planId });
      const { order_id, amount, key_id } = orderResponse.data;

      // Load Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: key_id,
          amount: amount,
          currency: 'INR',
          name: 'JaipurEyeVision Studio',
          description: `${planId.replace('_', ' ')} Subscription`,
          order_id: order_id,
          handler: async (response) => {
            try {
              await subscriptionAPI.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success('Subscription activated!');
              await refreshUser();
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: {
            color: '#D946EF',
          },
          config: {
            display: {
              blocks: {
                utib: {
                  name: "Pay using UPI QR",
                  instruments: [
                    {
                      method: "upi",
                      flows: ["qr"],
                      apps: ["google_pay", "phonepe", "paytm"]
                    }
                  ]
                },
                other: {
                  name: "Other Payment Methods",
                  instruments: [
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                    { method: "upi", flows: ["collect", "intent"] }
                  ]
                }
              },
              sequence: ["block.utib", "block.other"],
              preferences: {
                show_default_blocks: false
              }
            }
          },
          modal: {
            confirm_close: true,
            escape: false
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setProcessingPlan(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPlanBadge = (plan) => {
    if (plan.id === '30_days') return <Badge className="bg-primary">Popular</Badge>;
    if (plan.id === '365_days') return <Badge className="bg-accent text-black">Best Value</Badge>;
    return null;
  };

  return (
    <div className="space-y-8" data-testid="billing-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground">Choose a plan to get credits</p>
          </div>
        </div>
      </motion.div>

      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Credits Balance</p>
                <p className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  {user?.credits || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-semibold capitalize">
                  {user?.subscription_plan?.replace('_', ' ') || 'No Plan'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="text-xl font-semibold">
                  {user?.subscription_expiry
                    ? new Date(user.subscription_expiry).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">Choose a Plan</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Card className={`glass border-white/10 h-full card-hover ${
                  plan.id === '30_days' ? 'border-primary/50' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {getPlanBadge(plan)}
                    </div>
                    <CardDescription>{plan.days} days access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-4xl font-bold">{formatPrice(plan.price)}</p>
                      <p className="text-sm text-muted-foreground">one-time payment</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{plan.credits} Credits</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>All AI Features</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>RAG Knowledge Base</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Priority Support</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={processingPlan === plan.id}
                      className={`w-full ${plan.id === '30_days' ? 'glow-primary' : ''}`}
                      variant={plan.id === '30_days' ? 'default' : 'outline'}
                      data-testid={`subscribe-${plan.id}`}
                    >
                      {processingPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Subscribe
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Payment Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass border-white/10">
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Secure payments powered by</span>
              <span className="font-semibold text-foreground">Razorpay</span>
              <span>•</span>
              <span>All major cards accepted</span>
              <span>•</span>
              <span>UPI, Net Banking</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BillingPage;
