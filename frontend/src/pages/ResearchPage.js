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
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Search, Loader2, Copy, Download, Sparkles, AlertTriangle, CheckCircle, Lightbulb, BookOpen, ExternalLink } from 'lucide-react';

const ResearchPage = () => {
  const { refreshCredits } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    topic: '',
    depth: 'comprehensive',
    focus_areas: [],
  });
  const [focusInput, setFocusInput] = useState('');

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a research topic');
      return;
    }

    setLoading(true);
    try {
      const response = await genAPI.research(formData);
      setResult(response.data);
      await refreshCredits();
      toast.success('Research report generated!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const addFocusArea = () => {
    if (focusInput.trim() && !formData.focus_areas.includes(focusInput.trim())) {
      setFormData({
        ...formData,
        focus_areas: [...formData.focus_areas, focusInput.trim()],
      });
      setFocusInput('');
    }
  };

  const removeFocusArea = (area) => {
    setFormData({
      ...formData,
      focus_areas: formData.focus_areas.filter((a) => a !== area),
    });
  };

  const copyReport = () => {
    const report = `
Executive Summary:
${result?.executive_summary}

Key Insights:
${result?.key_insights?.map((i) => `• ${i}`).join('\n')}

Risks:
${result?.risks?.map((r) => `• ${r}`).join('\n')}

Action Steps:
${result?.action_steps?.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Sources:
${result?.sources?.map((s) => `• ${s}`).join('\n')}
    `;
    navigator.clipboard.writeText(report);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-8" data-testid="research-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Research Expert</h1>
            <p className="text-muted-foreground">Generate comprehensive research reports</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>Research Parameters</CardTitle>
              <CardDescription>Define your research scope</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Research Topic</Label>
                <Textarea
                  placeholder="e.g., Impact of AI on healthcare in emerging markets"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  rows={3}
                  data-testid="research-topic-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Research Depth</Label>
                <Select
                  value={formData.depth}
                  onValueChange={(v) => setFormData({ ...formData, depth: v })}
                >
                  <SelectTrigger data-testid="research-depth-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief Overview</SelectItem>
                    <SelectItem value="moderate">Moderate Analysis</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive Study</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Focus Areas (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add focus area..."
                    value={focusInput}
                    onChange={(e) => setFocusInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
                    data-testid="research-focus-input"
                  />
                  <Button variant="outline" onClick={addFocusArea}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.focus_areas.map((area) => (
                    <Badge
                      key={area}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeFocusArea(area)}
                    >
                      {area} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full glow-primary"
                data-testid="research-generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Report
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
          className="lg:col-span-2"
        >
          <Card className="glass border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Research Report</CardTitle>
                  <CardDescription>
                    {result ? `${result.credits_used} credits used` : 'Your report will appear here'}
                  </CardDescription>
                </div>
                {result && (
                  <Button variant="outline" size="sm" onClick={copyReport}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Executive Summary</h3>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap" data-testid="research-summary">
                      {result.executive_summary}
                    </p>
                  </div>

                  {/* Key Insights */}
                  <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-cyan-500" />
                      <h3 className="font-semibold text-cyan-500">Key Insights</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.key_insights?.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks */}
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <h3 className="font-semibold text-destructive">Risks</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.risks?.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Steps */}
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h3 className="font-semibold text-green-500">Action Steps</h3>
                    </div>
                    <ol className="space-y-2">
                      {result.action_steps?.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs shrink-0">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Sources */}
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-semibold">Sources</h3>
                    </div>
                    <ul className="space-y-1">
                      {result.sources?.map((source, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {source}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Citations from RAG */}
                  {result.citations && result.citations.length > 0 && (
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-sm font-medium text-accent mb-2">From your knowledge base:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {result.citations.map((c, i) => (
                          <li key={i}>• {c.doc_name} (relevance: {c.relevance_score})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <Search className="w-12 h-12 mb-4 opacity-50" />
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

export default ResearchPage;
