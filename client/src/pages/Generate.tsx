import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useJobSocket } from "@/hooks/useJobSocket";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Sparkles, Wand2, Zap, Download, Share2, RefreshCw,
  Coins, CheckCircle, XCircle, Loader2, ImagePlus, Info
} from "lucide-react";

const STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "digital art", label: "Digital Art" },
  { value: "oil painting", label: "Oil Painting" },
  { value: "watercolor", label: "Watercolor" },
  { value: "anime", label: "Anime" },
  { value: "cinematic", label: "Cinematic" },
  { value: "3d render", label: "3D Render" },
  { value: "sketch", label: "Sketch" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 Square" },
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
  { value: "4:3", label: "4:3 Classic" },
];

const QUALITY_OPTIONS = [
  { value: "standard", label: "Standard", cost: 1, desc: "10 credits" },
  { value: "hd", label: "HD", cost: 2, desc: "20 credits" },
  { value: "ultra", label: "Ultra", cost: 3, desc: "30 credits" },
];

const JOB_TYPES = [
  { value: "generate", label: "Generate", icon: Sparkles, cost: 10 },
  { value: "edit", label: "Edit", icon: Wand2, cost: 15 },
  { value: "style_transfer", label: "Style Transfer", icon: RefreshCw, cost: 12 },
];

export default function Generate() {
  const { user, isAuthenticated } = useAuth();
  const { jobUpdates, clearJobUpdate } = useJobSocket(user?.id);

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [quality, setQuality] = useState<"standard" | "hd" | "ultra">("standard");
  const [jobType, setJobType] = useState<"generate" | "edit" | "style_transfer">("generate");
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const { data: creditData, refetch: refetchCredits } = trpc.credits.balance.useQuery(undefined, { enabled: isAuthenticated });
  const optimizePrompt = trpc.prompt.optimize.useMutation();
  const createJob = trpc.images.create.useMutation({
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
      toast.info(`Job started! Cost: ${data.creditCost} credits`);
      refetchCredits();
    },
    onError: (err) => toast.error(err.message),
  });

  // Watch for job updates via WebSocket
  const jobUpdate = currentJobId ? jobUpdates[currentJobId] : null;

  useEffect(() => {
    if (jobUpdate?.status === "completed" && jobUpdate.resultImageUrl) {
      setResultImage(jobUpdate.resultImageUrl);
      toast.success("Image generated successfully!");
      refetchCredits();
    } else if (jobUpdate?.status === "failed") {
      toast.error(`Generation failed: ${jobUpdate.message}`);
      refetchCredits();
    }
  }, [jobUpdate?.status]);

  const handleGenerate = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    setResultImage(null);
    if (currentJobId) clearJobUpdate(currentJobId);
    createJob.mutate({ jobType, prompt, style, aspectRatio, quality, isPublic });
  };

  const handleOptimize = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt first"); return; }
    const result = await optimizePrompt.mutateAsync({ prompt, style, jobType });
    setPrompt(result.optimized);
    toast.success("Prompt optimized!");
  };

  const creditCost = 10 * (quality === "standard" ? 1 : quality === "hd" ? 2 : 3);
  const hasEnoughCredits = (creditData?.credits ?? 0) >= creditCost;
  const isProcessing = jobUpdate?.status === "processing" || jobUpdate?.status === "pending" || createJob.isPending;

  return (
    <div className="min-h-full p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">AI Image Studio</h1>
          <p className="text-muted-foreground">Generate and edit images with AI. Describe what you want to create.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Job Type */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <label className="text-sm font-medium mb-3 block">Operation Type</label>
              <div className="grid grid-cols-3 gap-2">
                {JOB_TYPES.map(({ value, label, icon: Icon, cost }) => (
                  <button
                    key={value}
                    onClick={() => setJobType(value as any)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${jobType === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    <span className="text-[10px] opacity-70">{cost}cr</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Prompt</label>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={handleOptimize} disabled={optimizePrompt.isPending}>
                  {optimizePrompt.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  AI Optimize
                </Button>
              </div>
              <Textarea
                placeholder="Describe the image you want to create... e.g., 'A serene mountain lake at sunset with golden reflections'"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none bg-background text-sm"
                maxLength={2000}
              />
              <div className="text-xs text-muted-foreground mt-1.5 text-right">{prompt.length}/2000</div>
            </div>

            {/* Style & Ratio */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <label className="text-sm font-medium block">Style & Format</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Art Style</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-9 text-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="h-9 text-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Quality */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <label className="text-sm font-medium mb-3 block">Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {QUALITY_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setQuality(value as any)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${quality === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
                  >
                    {label}
                    <span className="text-[10px] opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <div className="text-sm font-medium">Share to Gallery</div>
                <div className="text-xs text-muted-foreground">Make this image public</div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`w-10 h-5 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-border"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Generate button */}
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleGenerate}
              disabled={isProcessing || !hasEnoughCredits || !prompt.trim()}
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
              ) : (
                <><Sparkles className="w-5 h-5" />Generate — {creditCost} Credits</>
              )}
            </Button>

            {!hasEnoughCredits && isAuthenticated && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-3 rounded-lg">
                <Info className="w-4 h-4 shrink-0" />
                Insufficient credits. <a href="/credits" className="underline ml-1">Top up here</a>
              </div>
            )}
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3">
            <div className="rounded-xl bg-card border border-border overflow-hidden h-full min-h-[500px] flex flex-col">
              {/* Progress */}
              {isProcessing && jobUpdate && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{jobUpdate.message}</span>
                    <span className="text-sm text-muted-foreground">{jobUpdate.progress}%</span>
                  </div>
                  <Progress value={jobUpdate.progress} className="h-2" />
                </div>
              )}

              {/* Image result */}
              <div className="flex-1 flex items-center justify-center p-6">
                {resultImage ? (
                  <div className="w-full">
                    <img src={resultImage} alt="Generated" className="w-full rounded-lg object-contain max-h-[480px]" />
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1" asChild>
                        <a href={resultImage} download="ai-generated.png" target="_blank">
                          <Download className="w-4 h-4" />Download
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => {
                        navigator.clipboard.writeText(resultImage);
                        toast.success("URL copied!");
                      }}>
                        <Share2 className="w-4 h-4" />Share
                      </Button>
                    </div>
                  </div>
                ) : jobUpdate?.status === "failed" ? (
                  <div className="text-center">
                    <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{jobUpdate.message}</p>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">AI is creating your image...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <ImagePlus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-1">Your image will appear here</p>
                    <p className="text-sm text-muted-foreground">Enter a prompt and click Generate to start</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
