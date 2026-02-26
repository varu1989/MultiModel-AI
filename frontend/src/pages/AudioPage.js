import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { genAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Mic, Loader2, Play, Pause, Download, Upload, Sparkles, Volume2, FileAudio } from 'lucide-react';

const voices = [
  { value: 'alloy', label: 'Alloy (Neutral)' },
  { value: 'ash', label: 'Ash (Clear)' },
  { value: 'coral', label: 'Coral (Warm)' },
  { value: 'echo', label: 'Echo (Smooth)' },
  { value: 'fable', label: 'Fable (Expressive)' },
  { value: 'nova', label: 'Nova (Energetic)' },
  { value: 'onyx', label: 'Onyx (Deep)' },
  { value: 'sage', label: 'Sage (Wise)' },
  { value: 'shimmer', label: 'Shimmer (Bright)' },
];

const AudioPage = () => {
  const { refreshCredits } = useAuth();
  const [activeTab, setActiveTab] = useState('tts');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // TTS state
  const [ttsData, setTtsData] = useState({
    text: '',
    voice: 'alloy',
    speed: 1.0,
  });
  const [ttsResult, setTtsResult] = useState(null);
  
  // STT state
  const [sttFile, setSttFile] = useState(null);
  const [sttResult, setSttResult] = useState(null);

  const handleTTS = async () => {
    if (!ttsData.text.trim()) {
      toast.error('Please enter text to convert');
      return;
    }

    setLoading(true);
    try {
      const response = await genAPI.tts(ttsData);
      setTtsResult(response.data);
      await refreshCredits();
      toast.success('Audio generated!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSTT = async () => {
    if (!sttFile) {
      toast.error('Please select an audio file');
      return;
    }

    setLoading(true);
    try {
      const response = await genAPI.stt(sttFile);
      setSttResult(response.data);
      await refreshCredits();
      toast.success('Transcription complete!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transcription failed');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadAudio = () => {
    if (ttsResult?.audio_base64) {
      const link = document.createElement('a');
      link.href = `data:audio/mp3;base64,${ttsResult.audio_base64}`;
      link.download = `speech-${Date.now()}.mp3`;
      link.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSttFile(file);
      setSttResult(null);
    }
  };

  return (
    <div className="space-y-8" data-testid="audio-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Mic className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Audio Generator</h1>
            <p className="text-muted-foreground">Text-to-Speech & Speech-to-Text</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tts" data-testid="tts-tab">
            <Volume2 className="w-4 h-4 mr-2" />
            Text to Speech
          </TabsTrigger>
          <TabsTrigger value="stt" data-testid="stt-tab">
            <FileAudio className="w-4 h-4 mr-2" />
            Speech to Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tts" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* TTS Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle>Text to Speech</CardTitle>
                  <CardDescription>Convert text into natural speech</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Text (max 4096 characters)</Label>
                    <Textarea
                      placeholder="Enter the text you want to convert to speech..."
                      value={ttsData.text}
                      onChange={(e) => setTtsData({ ...ttsData, text: e.target.value.slice(0, 4096) })}
                      rows={6}
                      data-testid="tts-text-input"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {ttsData.text.length}/4096
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select
                      value={ttsData.voice}
                      onValueChange={(v) => setTtsData({ ...ttsData, voice: v })}
                    >
                      <SelectTrigger data-testid="tts-voice-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Speed: {ttsData.speed}x</Label>
                    <Slider
                      value={[ttsData.speed]}
                      onValueChange={(v) => setTtsData({ ...ttsData, speed: v[0] })}
                      min={0.25}
                      max={4}
                      step={0.25}
                      data-testid="tts-speed-slider"
                    />
                  </div>

                  <Button
                    onClick={handleTTS}
                    disabled={loading}
                    className="w-full glow-primary"
                    data-testid="tts-generate-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Speech
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* TTS Output */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-white/10 h-full">
                <CardHeader>
                  <CardTitle>Generated Audio</CardTitle>
                  <CardDescription>
                    {ttsResult ? `${ttsResult.credits_used} credits used` : 'Your audio will appear here'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ttsResult ? (
                    <div className="space-y-6">
                      <audio
                        ref={audioRef}
                        src={`data:audio/mp3;base64,${ttsResult.audio_base64}`}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                      
                      <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                          <Volume2 className={`w-12 h-12 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
                        </div>
                        
                        <div className="flex gap-4">
                          <Button
                            size="lg"
                            onClick={playAudio}
                            className="glow-primary"
                            data-testid="tts-play-btn"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-5 h-5 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                Play
                              </>
                            )}
                          </Button>
                          
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={downloadAudio}
                            data-testid="tts-download-btn"
                          >
                            <Download className="w-5 h-5 mr-2" />
                            Download MP3
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <Volume2 className="w-12 h-12 mb-4 opacity-50" />
                      <p>Enter text and click generate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="stt" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* STT Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle>Speech to Text</CardTitle>
                  <CardDescription>Transcribe audio files to text</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="stt-file-input"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {sttFile ? (
                      <p className="text-primary font-medium">{sttFile.name}</p>
                    ) : (
                      <>
                        <p className="font-medium">Click to upload audio</p>
                        <p className="text-sm text-muted-foreground">MP3, WAV, M4A (max 25MB)</p>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={handleSTT}
                    disabled={loading || !sttFile}
                    className="w-full glow-primary"
                    data-testid="stt-transcribe-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Transcribing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Transcribe Audio
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* STT Output */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-white/10 h-full">
                <CardHeader>
                  <CardTitle>Transcription</CardTitle>
                  <CardDescription>
                    {sttResult ? `${sttResult.credits_used} credits used` : 'Your transcription will appear here'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sttResult ? (
                    <div className="p-4 rounded-lg bg-white/5 min-h-[200px]" data-testid="stt-result">
                      <p className="whitespace-pre-wrap">{sttResult.text}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <FileAudio className="w-12 h-12 mb-4 opacity-50" />
                      <p>Upload an audio file to transcribe</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AudioPage;
