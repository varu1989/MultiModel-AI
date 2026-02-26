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
import { Code, Loader2, Copy, Download, Sparkles, Play, Bug, BookOpen, RefreshCw, TestTube } from 'lucide-react';

const codeActions = [
  { value: 'write', label: 'Write Code', icon: Code, desc: 'Generate new code' },
  { value: 'debug', label: 'Debug Code', icon: Bug, desc: 'Find and fix bugs' },
  { value: 'explain', label: 'Explain Code', icon: BookOpen, desc: 'Understand code' },
  { value: 'refactor', label: 'Refactor', icon: RefreshCw, desc: 'Improve code' },
  { value: 'test', label: 'Unit Tests', icon: TestTube, desc: 'Generate tests' },
];

const languages = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'ruby', 'php', 'sql'];

const CodePage = () => {
  const { refreshCredits } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeAction, setActiveAction] = useState('write');
  const [formData, setFormData] = useState({
    action: 'write',
    code: '',
    language: 'python',
    description: '',
  });

  const handleGenerate = async () => {
    if (activeAction === 'write' && !formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (['debug', 'explain', 'refactor', 'test'].includes(activeAction) && !formData.code.trim()) {
      toast.error('Please enter the code');
      return;
    }

    setLoading(true);
    try {
      const response = await genAPI.code({
        ...formData,
        action: activeAction,
      });
      setResult(response.data);
      await refreshCredits();
      toast.success('Code generated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result?.code || '');
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-8" data-testid="code-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Code className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Code Generator</h1>
            <p className="text-muted-foreground">Write, debug, and improve code with AI</p>
          </div>
        </div>
      </motion.div>

      {/* Action tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 overflow-x-auto pb-2"
      >
        {codeActions.map((action) => (
          <button
            key={action.value}
            onClick={() => {
              setActiveAction(action.value);
              setFormData({ ...formData, action: action.value });
            }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors whitespace-nowrap ${
              activeAction === action.value
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
            data-testid={`code-action-${action.value}`}
          >
            <action.icon className="w-4 h-4" />
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle>{codeActions.find(a => a.value === activeAction)?.label}</CardTitle>
              <CardDescription>{codeActions.find(a => a.value === activeAction)?.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(v) => setFormData({ ...formData, language: v })}
                >
                  <SelectTrigger data-testid="code-language-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang} className="capitalize">
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeAction === 'write' ? (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe what you want the code to do..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    data-testid="code-description-input"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Your Code</Label>
                    <Textarea
                      placeholder="Paste your code here..."
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      rows={10}
                      className="font-mono text-sm"
                      data-testid="code-input"
                    />
                  </div>
                  {activeAction === 'debug' && (
                    <div className="space-y-2">
                      <Label>Issue Description (Optional)</Label>
                      <Input
                        placeholder="Describe the bug or error..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        data-testid="code-issue-input"
                      />
                    </div>
                  )}
                </>
              )}

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full glow-primary"
                data-testid="code-generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {activeAction === 'write' ? 'Generate Code' : `${codeActions.find(a => a.value === activeAction)?.label}`}
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
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-white/10 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Result</CardTitle>
                  <CardDescription>
                    {result ? `${result.credits_used} credits used` : 'Your code will appear here'}
                  </CardDescription>
                </div>
                {result && (
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-black/50 min-h-[300px] overflow-auto">
                    <pre className="font-mono text-sm whitespace-pre-wrap" data-testid="code-result">
                      {result.code}
                    </pre>
                  </div>
                  {result.explanation && (
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm font-medium mb-2">Explanation:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Code className="w-12 h-12 mb-4 opacity-50" />
                  <p>Enter your request and click generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CodePage;
