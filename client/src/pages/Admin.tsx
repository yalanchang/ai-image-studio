import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShieldCheck, Users, BarChart3, Coins, Search, Loader2,
  TrendingUp, Image, Zap, Gift, CheckCircle, XCircle
} from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Admin() {
  const { isAuthenticated } = useAuth0();
  const { data: user } = trpc.auth.me.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const [search, setSearch] = useState("");
  const [grantUserId, setGrantUserId] = useState<number | null>(null);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [newPkg, setNewPkg] = useState({ name: "", credits: "", price: "", description: "", isFeatured: false });

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.users.useQuery({ page: 1, limit: 50, search: search || undefined }, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: packages, refetch: refetchPkgs } = trpc.admin.packages.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("角色已更新"); refetchUsers(); },
    onError: (err) => toast.error(err.message),
  });

  const grantCreditsMutation = trpc.admin.grantCredits.useMutation({
    onSuccess: (data) => {
      toast.success(`已發放積分！新餘額：${data.newBalance}`);
      setGrantUserId(null); setGrantAmount(""); setGrantReason("");
      refetchUsers();
    },
    onError: (err) => toast.error(err.message),
  });

  const upsertPackageMutation = trpc.admin.upsertPackage.useMutation({
    onSuccess: () => { toast.success("方案已儲存"); refetchPkgs(); setNewPkg({ name: "", credits: "", price: "", description: "", isFeatured: false }); },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-20 px-4 text-center">
        <ShieldCheck className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">需要管理員權限</h2>
        <p className="text-muted-foreground text-sm">您沒有權限存取此頁面。</p>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">管理後台</h1>
          <p className="text-muted-foreground">系統概覽與管理</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="w-4 h-4" />系統概覽</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" />用戶管理</TabsTrigger>
            <TabsTrigger value="packages" className="gap-2"><Coins className="w-4 h-4" />積分方案</TabsTrigger>
          </TabsList>

          {}
          <TabsContent value="overview">
            {statsLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="總用戶數" value={stats.totalUsers} />
                  <StatCard icon={Image} label="總任務數" value={stats.totalJobs ?? 0} />
                  <StatCard icon={CheckCircle} label="已完成" value={stats.completedJobs ?? 0} color="text-green-400" />
                  <StatCard icon={XCircle} label="失敗" value={stats.failedJobs ?? 0} color="text-red-400" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard icon={Zap} label="今日任務" value={stats.jobsToday ?? 0} sub="過去 24 小時" />
                  <StatCard icon={TrendingUp} label="本週任務" value={stats.jobsWeek ?? 0} sub="過去 7 天" />
                  <StatCard icon={Coins} label="已消耗積分" value={stats.totalSpent ?? 0} sub="累計" color="text-yellow-400" />
                </div>
                {}
                <div className="p-5 rounded-xl bg-card border border-border">
                  <h3 className="font-display font-semibold mb-4">系統健康度</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">成功率</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(stats.totalJobs ?? 0) > 0 ? Math.round(((stats.completedJobs ?? 0) / (stats.totalJobs ?? 1)) * 100) : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">失敗率</div>
                      <div className="text-2xl font-bold text-red-400">
                        {(stats.totalJobs ?? 0) > 0 ? Math.round(((stats.failedJobs ?? 0) / (stats.totalJobs ?? 1)) * 100) : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">已儲值積分</div>
                      <div className="text-2xl font-bold text-yellow-400">{stats.totalEarned}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="搜尋用戶..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">用戶</th>
                          <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">角色</th>
                          <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">積分</th>
                          <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">生成次數</th>
                          <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">加入日期</th>
                          <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersData?.items.map((u, i) => (
                          <tr key={u.id} className={`${i !== (usersData.items.length - 1) ? "border-b border-border" : ""} hover:bg-muted/20 transition-colors`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                  {u.name?.[0]?.toUpperCase() ?? "U"}
                                </div>
                                <div>
                                  <div className="font-medium text-xs">{u.name ?? "—"}</div>
                                  <div className="text-[10px] text-muted-foreground">{u.email ?? "—"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Select
                                value={u.role}
                                onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role: role as any })}
                              >
                                <SelectTrigger className="h-7 w-24 text-xs bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">一般</SelectItem>
                                  <SelectItem value="premium">高級</SelectItem>
                                  <SelectItem value="admin">管理員</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Coins className="w-3 h-3 text-yellow-400" />{u.credits}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{u.totalGenerated} 次</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("zh-TW")}</td>
                            <td className="px-4 py-3">
                              {grantUserId === u.id ? (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    type="number"
                                    placeholder="數量"
                                    value={grantAmount}
                                    onChange={e => setGrantAmount(e.target.value)}
                                    className="h-7 w-20 text-xs bg-background"
                                  />
                                  <Input
                                    placeholder="原因"
                                    value={grantReason}
                                    onChange={e => setGrantReason(e.target.value)}
                                    className="h-7 w-24 text-xs bg-background"
                                  />
                                  <Button size="sm" className="h-7 text-xs px-2" onClick={() => {
                                    if (!grantAmount || !grantReason) return;
                                    grantCreditsMutation.mutate({ userId: u.id, amount: Number(grantAmount), reason: grantReason });
                                  }}>
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setGrantUserId(null)}>
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setGrantUserId(u.id)}>
                                  <Gift className="w-3 h-3" />發放積分
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {}
          <TabsContent value="packages">
            <div className="space-y-6">
              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {packages?.map((pkg) => (
                  <div key={pkg.id} className="p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{pkg.name}</span>
                      {pkg.isFeatured && <Badge className="text-[10px]">推薦</Badge>}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">{pkg.credits} <span className="text-sm text-muted-foreground font-normal">積分</span></div>
                    <div className="text-sm text-muted-foreground mb-3">${pkg.price} {pkg.currency}</div>
                    {pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}
                  </div>
                ))}
              </div>

              {}
              <div className="p-5 rounded-xl bg-card border border-border">
                <h3 className="font-display font-semibold mb-4">新增積分方案</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <Input placeholder="方案名稱" value={newPkg.name} onChange={e => setNewPkg(p => ({ ...p, name: e.target.value }))} className="bg-background" />
                  <Input type="number" placeholder="積分數量" value={newPkg.credits} onChange={e => setNewPkg(p => ({ ...p, credits: e.target.value }))} className="bg-background" />
                  <Input type="number" placeholder="價格（美元）" value={newPkg.price} onChange={e => setNewPkg(p => ({ ...p, price: e.target.value }))} className="bg-background" />
                  <Input placeholder="描述（選填）" value={newPkg.description} onChange={e => setNewPkg(p => ({ ...p, description: e.target.value }))} className="bg-background col-span-2" />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="featured" checked={newPkg.isFeatured} onChange={e => setNewPkg(p => ({ ...p, isFeatured: e.target.checked }))} />
                    <label htmlFor="featured" className="text-sm">設為推薦</label>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!newPkg.name || !newPkg.credits || !newPkg.price) { toast.error("請填寫所有必填欄位"); return; }
                    upsertPackageMutation.mutate({ name: newPkg.name, credits: Number(newPkg.credits), price: Number(newPkg.price), description: newPkg.description || undefined, isFeatured: newPkg.isFeatured });
                  }}
                  disabled={upsertPackageMutation.isPending}
                >
                  {upsertPackageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  新增方案
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
