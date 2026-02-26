import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { genAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Loader2, Copy, Download, Sparkles } from 'lucide-react';

const contentTypes = [
  { value: 'blog', label: 'Blog Post' },
  { value: 'ad', label: 'Ad Copy' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social Captions' },
  { value: 'slide', label: 'Slide Outline' },
  { value: 'script', label: 'Script' },
];

const tones = ['professional', 'casual', 'formal', 'friendly', 'persuasive', 'informative'];
const lengths = ['short', 'medium', 'long'];

const ContentPage = () => {
  const { refreshCredits } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    content_type: 'blog',
    topic: '',
    tone: 'professional',
    length: 'medium',
    additional_context: '',
  });

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const response = await genAPI.content(formData);
      setResult(response.data);
      await refreshCredits();
      toast.success('Content generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result?.content || '');
    toast.success('Copied to clipboard!');
  };

  const downloadContent = () => {
    const blob = new Blob([result?.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.content_type}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8" data-testid="content-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Content Generator</h1>
            <p className="text-muted-foreground">Create engaging content with AI</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Generate Content</CardTitle>
              <CardDescription>Choose type, topic, and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) => setFormData({ ...formData, content_type: v })}
                >
                  <SelectTrigger data-testid="content-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Topic / Subject</Label>
                <Input
                  placeholder="e.g., Benefits of AI in healthcare"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  data-testid="content-topic-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(v) => setFormData({ ...formData, tone: v })}
                  >
                    <SelectTrigger data-testid="content-tone-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((tone) => (
                        <SelectItem key={tone} value={tone} className="capitalize">
                          {tone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Length</Label>
                  <Select
                    value={formData.length}
                    onValueChange={(v) => setFormData({ ...formData, length: v })}
                  >
                    <SelectTrigger data-testid="content-length-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengths.map((len) => (
                        <SelectItem key={len} value={len} className="capitalize">
                          {len}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Context (Optional)</Label>
                <Textarea
                  placeholder="Any specific points to include..."
                  value={formData.additional_context}
                  onChange={(e) => setFormData({ ...formData, additional_context: e.target.value })}
                  rows={3}
                  data-testid="content-context-input"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full glow-primary"
                data-testid="content-generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Output section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-white/10 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    {result ? `${result.credits_used} credits used` : 'Your content will appear here'}
                  </CardDescription>
                </div>
                {result && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={downloadContent}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/5 min-h-[300px] whitespace-pre-wrap" data-testid="content-result">
                    {result.content}
                  </div>
                  {result.citations && result.citations.length > 0 && (
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-sm font-medium text-accent mb-2">Sources from your documents:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {result.citations.map((c, i) => (
                          <li key={i}>• {c.doc_name} (relevance: {c.relevance_score})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4 opacity-50" />
                  <p>Enter a topic and click generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ContentPage;
