import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Coins, Zap, TrendingUp, TrendingDown, Gift, Loader2, Star, CheckCircle } from "lucide-react";

const TX_ICONS: Record<string, React.ReactNode> = {
  earn: <TrendingUp className="w-4 h-4 text-green-400" />,
  spend: <TrendingDown className="w-4 h-4 text-red-400" />,
  recharge: <Zap className="w-4 h-4 text-yellow-400" />,
  refund: <CheckCircle className="w-4 h-4 text-blue-400" />,
  bonus: <Gift className="w-4 h-4 text-purple-400" />,
};

export default function Credits() {
  const { isAuthenticated } = useAuth();
  const { data: creditData, refetch: refetchCredits } = trpc.credits.balance.useQuery(undefined, { enabled: isAuthenticated });
  const { data: historyData, isLoading: historyLoading } = trpc.credits.history.useQuery({ page: 1, limit: 20 }, { enabled: isAuthenticated });
  const { data: packages } = trpc.credits.packages.useQuery();

  const rechargeMutation = trpc.credits.recharge.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully added credits! New balance: ${data.newBalance}`);
      refetchCredits();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full py-20 px-4 text-center">
        <Coins className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">Sign in to manage credits</h2>
        <Button onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Credits</h1>
          <p className="text-muted-foreground">Manage your AI generation credits</p>
        </div>

        {/* Balance card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/10 border border-primary/30 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-foreground">{creditData?.credits ?? 0}</span>
                <span className="text-muted-foreground">credits</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Coins className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Credit costs reference */}
        <div className="p-5 rounded-xl bg-card border border-border mb-8">
          <h3 className="font-display font-semibold mb-4">Credit Costs per Operation</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { op: "Generate (Standard)", cost: 10 },
              { op: "Generate (HD)", cost: 20 },
              { op: "Generate (Ultra)", cost: 30 },
              { op: "Edit Image", cost: 15 },
              { op: "Style Transfer", cost: 12 },
              { op: "Object Remove", cost: 20 },
            ].map(({ op, cost }) => (
              <div key={op} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">{op}</span>
                <Badge variant="secondary" className="text-xs">{cost} cr</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Packages */}
        <div className="mb-8">
          <h3 className="font-display font-semibold text-lg mb-4">Top Up Credits</h3>
          {packages && packages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div key={pkg.id} className={`relative p-5 rounded-xl border transition-all ${pkg.isFeatured ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  {pkg.isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gap-1"><Star className="w-3 h-3 fill-current" />Best Value</Badge>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-display font-bold text-lg mb-1">{pkg.name}</div>
                    <div className="text-3xl font-bold text-primary mb-1">{pkg.credits}</div>
                    <div className="text-sm text-muted-foreground mb-1">credits</div>
                    {pkg.description && <p className="text-xs text-muted-foreground mb-4">{pkg.description}</p>}
                    <div className="text-lg font-semibold mb-4">${pkg.price} {pkg.currency}</div>
                    <Button
                      className="w-full"
                      variant={pkg.isFeatured ? "default" : "outline"}
                      onClick={() => rechargeMutation.mutate({ packageId: pkg.id, credits: pkg.credits })}
                      disabled={rechargeMutation.isPending}
                    >
                      {rechargeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Purchase
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-card border border-border text-center">
              <p className="text-muted-foreground text-sm">No credit packages available. Contact admin.</p>
            </div>
          )}
        </div>

        {/* Transaction history */}
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">Transaction History</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !historyData?.items.length ? (
            <div className="p-6 rounded-xl bg-card border border-border text-center">
              <p className="text-muted-foreground text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              {historyData.items.map((tx, i) => (
                <div key={tx.id} className={`flex items-center gap-4 px-4 py-3 ${i !== historyData.items.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {TX_ICONS[tx.type] ?? <Coins className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-semibold ${tx.type === "spend" ? "text-red-400" : "text-green-400"}`}>
                      {tx.type === "spend" ? "-" : "+"}{tx.amount}
                    </div>
                    <div className="text-xs text-muted-foreground">{tx.balanceAfter} bal</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
