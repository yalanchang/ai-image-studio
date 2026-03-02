import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Images, Search, Trash2, Download, Globe, Lock,
  Loader2, Sparkles, CheckCircle, XCircle, Clock, RefreshCw
} from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-400",
  failed: "text-red-400",
  processing: "text-yellow-400",
  pending: "text-blue-400",
  cancelled: "text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "已完成",
  failed: "失敗",
  processing: "處理中",
  pending: "等待中",
  cancelled: "已取消",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-3.5 h-3.5" />,
  failed: <XCircle className="w-3.5 h-3.5" />,
  processing: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  pending: <Clock className="w-3.5 h-3.5" />,
};

const JOB_TYPE_LABELS: Record<string, string> = {
  generate: "生成",
  edit: "編輯",
  style_transfer: "風格遷移",
  background_replace: "背景替換",
  object_remove: "物件移除",
  upscale: "超解析度",
};

export default function MyImages() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data, isLoading, refetch } = trpc.images.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    jobType: typeFilter !== "all" ? typeFilter : undefined,
  }, { enabled: isAuthenticated });

  const deleteMutation = trpc.images.delete.useMutation({
    onSuccess: () => { toast.success("圖像已刪除"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const retryMutation = trpc.images.retry.useMutation({
    onSuccess: (data) => {
      toast.success(`重試任務已開始！消耗 ${data.creditCost} 積分，新任務 #${data.jobId}`);
      refetch();
    },
    onError: (err) => toast.error(`重試失敗：${err.message}`),
  });

  const togglePublicMutation = trpc.images.togglePublic.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isPublic ? "已加入社群圖庫" : "已從社群圖庫移除");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-20 px-4 text-center">
        <Images className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">請先登入以查看您的圖片</h2>
        <p className="text-muted-foreground mb-6">您生成的所有圖像都會顯示在這裡</p>
        <Button onClick={() => loginWithRedirect({ appState: { returnTo: "/my-images" } })}>登入</Button>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">我的圖片</h1>
            <p className="text-muted-foreground">管理所有 AI 生成的創作</p>
          </div>
          <Link href="/generate">
            <Button className="gap-2"><Sparkles className="w-4 h-4" />新增創作</Button>
          </Link>
        </div>

        {/* 篩選器 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋提示詞..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-card"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-card"><SelectValue placeholder="狀態" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="processing">處理中</SelectItem>
              <SelectItem value="failed">失敗</SelectItem>
              <SelectItem value="pending">等待中</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-card"><SelectValue placeholder="操作類型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類型</SelectItem>
              <SelectItem value="generate">生成</SelectItem>
              <SelectItem value="edit">編輯</SelectItem>
              <SelectItem value="style_transfer">風格遷移</SelectItem>
              <SelectItem value="background_replace">背景替換</SelectItem>
              <SelectItem value="object_remove">物件移除</SelectItem>
              <SelectItem value="upscale">超解析度</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-20">
            <Images className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">找不到圖像</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {search || statusFilter !== "all" ? "請嘗試調整篩選條件" : "開始使用 AI 工作室創作第一張圖像"}
            </p>
            <Link href="/generate">
              <Button><Sparkles className="w-4 h-4 mr-2" />生成第一張圖像</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.items.map((job) => (
                <div key={job.id} className="group rounded-xl bg-card border border-border overflow-hidden hover:border-primary/50 transition-all">
                  {/* 圖像 */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {job.resultImageUrl ? (
                      <img src={job.resultImageUrl} alt={job.prompt} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {job.status === "processing" || job.status === "pending" ? (
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">處理中...</p>
                          </div>
                        ) : job.status === "failed" ? (
                          <div className="text-center px-3">
                            <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3">
                              {job.errorMessage || "生成失敗"}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 border-destructive/40 hover:border-destructive"
                              onClick={(e) => { e.stopPropagation(); retryMutation.mutate({ jobId: job.id }); }}
                              disabled={retryMutation.isPending && retryMutation.variables?.jobId === job.id}
                            >
                              {retryMutation.isPending && retryMutation.variables?.jobId === job.id ? (
                                <><Loader2 className="w-3 h-3 animate-spin" />重試中...</>
                              ) : (
                                <><RefreshCw className="w-3 h-3" />重試</>  
                              )}
                            </Button>
                          </div>
                        ) : (
                          <XCircle className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    {/* 狀態標籤 */}
                    <div className={`absolute top-2 left-2 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 ${STATUS_COLORS[job.status]}`}>
                      {STATUS_ICONS[job.status]}
                      {STATUS_LABELS[job.status] ?? job.status}
                    </div>
                    {/* 公開標誌 */}
                    {job.isPublic && (
                      <div className="absolute top-2 right-2">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                    )}
                    {/* 操作遮罩 */}
                    {job.resultImageUrl && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={job.resultImageUrl} download target="_blank" className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                          <Download className="w-4 h-4 text-white" />
                        </a>
                        <button
                          onClick={() => togglePublicMutation.mutate({ jobId: job.id, isPublic: !job.isPublic })}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          title={job.isPublic ? "設為私人" : "分享至圖庫"}
                        >
                          {job.isPublic ? <Lock className="w-4 h-4 text-white" /> : <Globe className="w-4 h-4 text-white" />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("確定要刪除這張圖像嗎？")) deleteMutation.mutate({ jobId: job.id });
                          }}
                          className="p-2 rounded-lg bg-red-500/40 hover:bg-red-500/60 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                  {/* 資訊 */}
                  <div className="p-3">
                    <p className="text-xs text-foreground line-clamp-2 mb-2">{job.prompt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {job.style && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{job.style}</Badge>}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {JOB_TYPE_LABELS[job.jobType] ?? job.jobType}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{job.creditCost}積分</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分頁 */}
            {data.total > 20 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
                <span className="text-sm text-muted-foreground">第 {page} 頁，共 {Math.ceil(data.total / 20)} 頁</span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)}>下一頁</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
