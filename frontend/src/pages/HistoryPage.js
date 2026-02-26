import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { historyAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { History as HistoryIcon, FileText, Code, Search, Mic, Image, Video, Loader2, Filter } from 'lucide-react';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await historyAPI.get(100);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      content: { icon: FileText, color: 'text-pink-500', bg: 'bg-pink-500/10' },
      code: { icon: Code, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      research: { icon: Search, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
      tts: { icon: Mic, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      stt: { icon: Mic, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      image: { icon: Image, color: 'text-orange-500', bg: 'bg-orange-500/10' },
      video: { icon: Video, color: 'text-green-500', bg: 'bg-green-500/10' },
    };
    return icons[action] || { icon: HistoryIcon, color: 'text-muted-foreground', bg: 'bg-white/5' };
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(item => item.action === filter);

  const totalCredits = history.reduce((sum, item) => sum + item.credits_used, 0);

  return (
    <div className="space-y-8" data-testid="history-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Generation History</h1>
              <p className="text-muted-foreground">View your past AI generations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Credits Used</p>
              <p className="text-2xl font-bold text-primary">{totalCredits}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4"
      >
        <Filter className="w-5 h-5 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48" data-testid="history-filter">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="content">Content</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="tts">Text to Speech</SelectItem>
            <SelectItem value="stt">Speech to Text</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Showing {filteredHistory.length} of {history.length} items
        </p>
      </motion.div>

      {/* History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass border-white/10">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No history found</p>
                <p className="text-sm">Start generating content to see your history</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredHistory.map((item, i) => {
                  const { icon: Icon, color, bg } = getActionIcon(item.action);
                  return (
                    <motion.div
                      key={item.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium capitalize">{item.action.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.details?.type || item.details?.action || item.details?.prompt?.slice(0, 50) || 'Generation'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">-{item.credits_used} credits</p>
                        <p className="text-sm text-muted-foreground">{formatDate(item.timestamp)}</p>
                      </div>
                    </motion.div>
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

export default HistoryPage;
