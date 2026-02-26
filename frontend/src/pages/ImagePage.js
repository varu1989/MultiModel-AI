import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { genAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Image as ImageIcon, Loader2, Download, Upload, Sparkles, Wand2, Eraser, Palette, Plus } from 'lucide-react';

const editTypes = [
  { value: 'enhance', label: 'Enhance', icon: Sparkles, desc: 'Improve quality' },
  { value: 'remove_bg', label: 'Remove BG', icon: Eraser, desc: 'Remove background' },
  { value: 'style_transfer', label: 'Style Transfer', icon: Palette, desc: 'Apply style' },
  { value: 'add_object', label: 'Add Object', icon: Plus, desc: 'Add elements' },
];

const ImagePage = () => {
  const { refreshCredits } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Generate state
  const [genData, setGenData] = useState({
    prompt: '',
    style: '',
  });
  const [genResult, setGenResult] = useState(null);
  
  // Edit state
  const [editData, setEditData] = useState({
    image_base64: '',
    prompt: '',
    edit_type: 'enhance',
  });
  const [editPreview, setEditPreview] = useState(null);
  const [editResult, setEditResult] = useState(null);

  const handleGenerate = async () => {
    if (!genData.prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      const response = await genAPI.image(genData);
      setGenResult(response.data);
      await refreshCredits();
      toast.success('Image generated!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editData.image_base64) {
      toast.error('Please upload an image');
      return;
    }
    if (!editData.prompt.trim()) {
      toast.error('Please enter editing instructions');
      return;
    }

    setLoading(true);
    try {
      const response = await genAPI.imageEdit(editData);
      setEditResult(response.data);
      await refreshCredits();
      toast.success('Image edited!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Edit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        setEditData({ ...editData, image_base64: base64 });
        setEditPreview(event.target.result);
        setEditResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = (base64) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-8" data-testid="image-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Image Generator</h1>
            <p className="text-muted-foreground">Create and edit images with AI</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="generate" data-testid="image-gen-tab">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="edit" data-testid="image-edit-tab">
            <Wand2 className="w-4 h-4 mr-2" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Generate Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle>Generate Image</CardTitle>
                  <CardDescription>Create images from text prompts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Prompt</Label>
                    <Textarea
                      placeholder="Describe the image you want to create..."
                      value={genData.prompt}
                      onChange={(e) => setGenData({ ...genData, prompt: e.target.value })}
                      rows={4}
                      data-testid="image-prompt-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Style (Optional)</Label>
                    <Input
                      placeholder="e.g., oil painting, digital art, photorealistic"
                      value={genData.style}
                      onChange={(e) => setGenData({ ...genData, style: e.target.value })}
                      data-testid="image-style-input"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full glow-primary"
                    data-testid="image-generate-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Generate Output */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-white/10 h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Generated Image</CardTitle>
                      <CardDescription>
                        {genResult ? `${genResult.credits_used} credits used` : 'Your image will appear here'}
                      </CardDescription>
                    </div>
                    {genResult && (
                      <Button variant="outline" size="icon" onClick={() => downloadImage(genResult.image_base64)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {genResult ? (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={`data:image/png;base64,${genResult.image_base64}`}
                        alt="Generated"
                        className="w-full h-auto"
                        data-testid="generated-image"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed border-white/10 rounded-lg">
                      <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                      <p>Enter a prompt and click generate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Edit Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle>Edit Image</CardTitle>
                  <CardDescription>Modify existing images with AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload */}
                  <div
                    className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="image-upload-input"
                    />
                    {editPreview ? (
                      <img src={editPreview} alt="Preview" className="w-full h-32 object-contain rounded-lg" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm">Click to upload image</p>
                      </>
                    )}
                  </div>

                  {/* Edit type */}
                  <div className="space-y-2">
                    <Label>Edit Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {editTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setEditData({ ...editData, edit_type: type.value })}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            editData.edit_type === type.value
                              ? 'bg-primary/10 border-primary'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                          data-testid={`edit-type-${type.value}`}
                        >
                          <type.icon className={`w-4 h-4 mb-1 ${editData.edit_type === type.value ? 'text-primary' : ''}`} />
                          <p className="text-sm font-medium">{type.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Textarea
                      placeholder="Describe the changes you want..."
                      value={editData.prompt}
                      onChange={(e) => setEditData({ ...editData, prompt: e.target.value })}
                      rows={3}
                      data-testid="edit-prompt-input"
                    />
                  </div>

                  <Button
                    onClick={handleEdit}
                    disabled={loading || !editData.image_base64}
                    className="w-full glow-primary"
                    data-testid="image-edit-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Apply Edit
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Edit Output */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="glass border-white/10 h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Edited Image</CardTitle>
                      <CardDescription>
                        {editResult ? `${editResult.credits_used} credits used` : 'Your edited image will appear here'}
                      </CardDescription>
                    </div>
                    {editResult && (
                      <Button variant="outline" size="icon" onClick={() => downloadImage(editResult.image_base64)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editResult ? (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={`data:image/png;base64,${editResult.image_base64}`}
                        alt="Edited"
                        className="w-full h-auto"
                        data-testid="edited-image"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed border-white/10 rounded-lg">
                      <Wand2 className="w-12 h-12 mb-4 opacity-50" />
                      <p>Upload an image and apply edits</p>
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

export default ImagePage;
