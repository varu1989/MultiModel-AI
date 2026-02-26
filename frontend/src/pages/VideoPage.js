import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { genAPI, jobsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Video, Loader2, Download, Sparkles, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const VideoPage = () => {
  const { refreshCredits } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    duration: 4,
    size: '1280x720',
  });
  const [job, setJob] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleGenerate = async () => {
    if (!formData.prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      const response = await genAPI.video(formData);
      setJob(response.data);
      await refreshCredits();
      toast.success('Video generation started!');
      
      // Start polling for job status
      const interval = setInterval(async () => {
        try {
          const statusRes = await jobsAPI.status(response.data.job_id);
          setJob(statusRes.data);
          
          if (statusRes.data.status === 'completed' || statusRes.data.status === 'failed') {
            clearInterval(interval);
            setPollingInterval(null);
            if (statusRes.data.status === 'completed') {
              toast.success('Video ready!');
            } else {
              toast.error('Video generation failed');
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 5000);
      
      setPollingInterval(interval);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    if (job?.id) {
      try {
        const statusRes = await jobsAPI.status(job.id);
        setJob(statusRes.data);
      } catch (error) {
        toast.error('Failed to refresh status');
      }
    }
  };

  const getStatusIcon = () => {
    switch (job?.status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-destructive" />;
      default:
        return null;
    }
  };

  const getProgress = () => {
    switch (job?.status) {
      case 'pending':
        return 10;
      case 'processing':
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-8" data-testid="video-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Video Generator</h1>
            <p className="text-muted-foreground">Create AI-powered videos from text</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Generate Video</CardTitle>
              <CardDescription>Describe your video and we'll create it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Video Prompt</Label>
                <Textarea
                  placeholder="Describe the video scene you want to create..."
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  rows={4}
                  data-testid="video-prompt-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={formData.duration.toString()}
                    onValueChange={(v) => setFormData({ ...formData, duration: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="video-duration-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 seconds</SelectItem>
                      <SelectItem value="8">8 seconds</SelectItem>
                      <SelectItem value="12">12 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(v) => setFormData({ ...formData, size: v })}
                  >
                    <SelectTrigger data-testid="video-size-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                      <SelectItem value="1792x1024">1792x1024 (Wide)</SelectItem>
                      <SelectItem value="1024x1792">1024x1792 (Portrait)</SelectItem>
                      <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-500">
                  <strong>Note:</strong> Video generation takes 2-10 minutes. Credits (20) are deducted upfront.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || (job?.status === 'pending' || job?.status === 'processing')}
                className="w-full glow-primary"
                data-testid="video-generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Video (20 credits)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Output */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-white/10 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Video Status</CardTitle>
                  <CardDescription>
                    {job ? `Job ID: ${job.job_id || job.id}` : 'Start a generation to see status'}
                  </CardDescription>
                </div>
                {job && (
                  <Button variant="outline" size="icon" onClick={refreshStatus}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {job ? (
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
                    {getStatusIcon()}
                    <div className="flex-1">
                      <p className="font-medium capitalize">{job.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.status === 'pending' && 'Waiting in queue...'}
                        {job.status === 'processing' && 'Generating your video...'}
                        {job.status === 'completed' && 'Video ready for download!'}
                        {job.status === 'failed' && (job.error || 'Generation failed')}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{getProgress()}%</span>
                    </div>
                    <Progress value={getProgress()} className="h-2" />
                  </div>

                  {/* Download */}
                  {job.status === 'completed' && (
                    <div className="space-y-4">
                      {job.result?.video_path && (
                        <video
                          controls
                          className="w-full rounded-lg"
                          data-testid="video-player"
                        >
                          <source src={jobsAPI.download(job.id)} type="video/mp4" />
                        </video>
                      )}
                      
                      <a
                        href={jobsAPI.download(job.id)}
                        download
                        className="block"
                      >
                        <Button className="w-full" data-testid="video-download-btn">
                          <Download className="w-4 h-4 mr-2" />
                          Download Video
                        </Button>
                      </a>
                    </div>
                  )}

                  {/* Error */}
                  {job.status === 'failed' && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{job.error || 'An error occurred during generation'}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Video className="w-12 h-12 mb-4 opacity-50" />
                  <p>Enter a prompt and click generate</p>
                  <p className="text-sm">Video generation may take several minutes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoPage;
