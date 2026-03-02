import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth0 } from "@auth0/auth0-react";
import { useJobSocket } from "@/hooks/useJobSocket";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sparkles, Wand2, Zap, Download, Share2, RefreshCw,
  CheckCircle, XCircle, Loader2, ImagePlus, Info
} from "lucide-react";

const STYLES = [
  { value: "photorealistic", label: "寫實攝影" },
  { value: "digital art", label: "數位藝術" },
  { value: "oil painting", label: "油畫" },
  { value: "watercolor", label: "水彩畫" },
  { value: "anime", label: "動漫風格" },
  { value: "cinematic", label: "電影感" },
  { value: "3d render", label: "3D 渲染" },
  { value: "sketch", label: "素描" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 正方形" },
  { value: "16:9", label: "16:9 橫向" },
  { value: "9:16", label: "9:16 直向" },
  { value: "4:3", label: "4:3 傳統" },
];

const QUALITY_OPTIONS = [
  { value: "standard", label: "標準", cost: 1, desc: "10 積分" },
  { value: "hd", label: "高清", cost: 2, desc: "20 積分" },
  { value: "ultra", label: "超清", cost: 3, desc: "30 積分" },
];

const JOB_TYPES = [
  { value: "generate", label: "生成", icon: Sparkles, cost: 10 },
  { value: "edit", label: "編輯", icon: Wand2, cost: 15 },
  { value: "style_transfer", label: "風格遷移", icon: RefreshCw, cost: 12 },
];

export default function Generate() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { data: dbUser } = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
  const { jobUpdates, clearJobUpdate } = useJobSocket(dbUser?.id);

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
  const utils = trpc.useUtils();

  const retryJob = trpc.images.retry.useMutation({
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
      setResultImage(null);
      toast.info(`重試已開始！消耗 ${data.creditCost} 積分`);
      refetchCredits();
    },
    onError: (err) => toast.error(`重試失敗：${err.message}`),
  });

  const createJob = trpc.images.create.useMutation({
    onSuccess: (data) => {
      setCurrentJobId(data.jobId);
      toast.info(`任務已開始！消耗 ${data.creditCost} 積分`);
      refetchCredits();
    },
    onError: (err) => toast.error(err.message),
  });

  const jobUpdate = currentJobId ? jobUpdates[currentJobId] : null;

  useEffect(() => {
    if (jobUpdate?.status === "completed" && jobUpdate.resultImageUrl) {
      setResultImage(jobUpdate.resultImageUrl);
      toast.success("圖像生成成功！");
      refetchCredits();
    } else if (jobUpdate?.status === "failed") {
      toast.error(`生成失敗：${jobUpdate.message}`);
      refetchCredits();
    }
  }, [jobUpdate?.status]);

  const handleGenerate = () => {
    if (!isAuthenticated) { loginWithRedirect({ appState: { returnTo: "/generate" } }); return; }
    if (!prompt.trim()) { toast.error("請輸入提示詞"); return; }
    setResultImage(null);
    if (currentJobId) clearJobUpdate(currentJobId);
    createJob.mutate({ jobType, prompt, style, aspectRatio, quality, isPublic });
  };

  const handleOptimize = async () => {
    if (!prompt.trim()) { toast.error("請先輸入提示詞"); return; }
    const result = await optimizePrompt.mutateAsync({ prompt, style, jobType });
    setPrompt(result.optimized);
    toast.success("提示詞已優化！");
  };

  const creditCost = 10 * (quality === "standard" ? 1 : quality === "hd" ? 2 : 3);
  const hasEnoughCredits = (creditData?.credits ?? 0) >= creditCost;
  const isProcessing = jobUpdate?.status === "processing" || jobUpdate?.status === "pending" || createJob.isPending || retryJob.isPending;
  const isFailed = jobUpdate?.status === "failed" && !isProcessing;
  const currentRetryCount = (jobUpdate as any)?.retryCount ?? 0;
  const hasRetriesLeft = currentRetryCount < 3;

  return (
    <div className="min-h-full p-6">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">INSTANT</h1>
          <p className="text-muted-foreground">使用 AI 生成與編輯圖像，描述您想創作的內容即可開始。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 控制面板 */}
          <div className="lg:col-span-2 space-y-5">
            {/* 操作類型 */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <label className="text-sm font-medium mb-3 block">操作類型</label>
              <div className="grid grid-cols-3 gap-2">
                {JOB_TYPES.map(({ value, label, icon: Icon, cost }) => (
                  <button
                    key={value}
                    onClick={() => setJobType(value as any)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${jobType === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    <span className="text-[10px] opacity-70">{cost}積分</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 提示詞 */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">提示詞</label>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={handleOptimize} disabled={optimizePrompt.isPending}>
                  {optimizePrompt.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  AI 優化
                </Button>
              </div>
              <Textarea
                placeholder="描述您想創作的圖像... 例如：「夕陽下的寧靜山湖，金色倒影映照水面」"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none bg-background text-sm"
                maxLength={2000}
              />
              <div className="text-xs text-muted-foreground mt-1.5 text-right">{prompt.length}/2000</div>
            </div>

            {/* 風格與比例 */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <label className="text-sm font-medium block">風格與格式</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">藝術風格</label>
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
                  <label className="text-xs text-muted-foreground mb-1 block">長寬比</label>
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

            {/* 畫質 */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <label className="text-sm font-medium mb-3 block">輸出畫質</label>
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

            {/* 公開分享開關 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <div className="text-sm font-medium">分享至圖庫</div>
                <div className="text-xs text-muted-foreground">將此圖像公開給社群</div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`w-10 h-5 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-border"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* 生成按鈕 */}
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleGenerate}
              disabled={isProcessing || !hasEnoughCredits || !prompt.trim()}
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" />處理中...</>
              ) : (
                <><Sparkles className="w-5 h-5" />生成圖像 — {creditCost} 積分</>
              )}
            </Button>

            {!hasEnoughCredits && isAuthenticated && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-3 rounded-lg">
                <Info className="w-4 h-4 shrink-0" />
                積分不足。<a href="/credits" className="underline ml-1">前往儲值</a>
              </div>
            )}
          </div>

          {/* 結果預覽面板 */}
          <div className="lg:col-span-3">
            <div className="rounded-xl bg-card border border-border overflow-hidden h-full min-h-[500px] flex flex-col">
              {/* 進度列 */}
              {isProcessing && jobUpdate && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{jobUpdate.message}</span>
                    <span className="text-sm text-muted-foreground">{jobUpdate.progress}%</span>
                  </div>
                  <Progress value={jobUpdate.progress} className="h-2" />
                </div>
              )}

              {/* 圖像結果 */}
              <div className="flex-1 flex items-center justify-center p-6">
                {resultImage ? (
                  <div className="w-full">
                    <img src={resultImage} alt="AI 生成圖像" className="w-full rounded-lg object-contain max-h-[480px]" />
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1" asChild>
                        <a href={resultImage} download="ai-generated.png" target="_blank">
                          <Download className="w-4 h-4" />下載圖像
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => {
                        navigator.clipboard.writeText(resultImage);
                        toast.success("連結已複製！");
                      }}>
                        <Share2 className="w-4 h-4" />分享連結
                      </Button>
                    </div>
                  </div>
                ) : isFailed ? (
                  <div className="text-center space-y-4">
                    <XCircle className="w-12 h-12 text-destructive mx-auto" />
                    <div>
                      <p className="font-medium text-destructive mb-1">生成失敗</p>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">{jobUpdate?.message || "發生未知錯誤"}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-center">
                      {!hasRetriesLeft ? (
                        <p className="text-sm text-muted-foreground">已達最大重試次數（3 次）</p>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-2 min-w-[140px]"
                          onClick={() => currentJobId && retryJob.mutate({ jobId: currentJobId })}
                          disabled={retryJob.isPending || !hasEnoughCredits}
                          title={`剩餘 ${3 - currentRetryCount} 次重試機會`}
                        >
                          {retryJob.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />重試中...</>
                          ) : (
                            <><RefreshCw className="w-4 h-4" />重試 ({3 - currentRetryCount}) — {creditCost} 積分</>
                          )}
                        </Button>
                      )}
                      {hasRetriesLeft && !hasEnoughCredits && (
                        <p className="text-xs text-destructive">
                          積分不足，<a href="/credits" className="underline">前往儲値</a>
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground gap-1.5"
                        onClick={() => {
                          if (currentJobId) clearJobUpdate(currentJobId);
                          setCurrentJobId(null);
                        }}
                      >
                        修改提示詞後重新生成
                      </Button>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">AI 正在創作您的圖像...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <ImagePlus className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-1">圖像將顯示於此</p>
                    <p className="text-sm text-muted-foreground">輸入提示詞並點擊「生成圖像」開始創作</p>
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
