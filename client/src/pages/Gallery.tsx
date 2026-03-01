import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, Eye, Download, Sparkles, Loader2, Star } from "lucide-react";

export default function Gallery() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.gallery.list.useQuery({ page, limit: 20, featured: false });
  const { data: likedData } = trpc.gallery.myLikes.useQuery(undefined, { enabled: isAuthenticated });
  const likeMutation = trpc.gallery.like.useMutation({
    onSuccess: (result) => {
      toast.success(result.liked ? "Added to favorites" : "Removed from favorites");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const likedIds = new Set(likedData?.likedIds ?? []);

  return (
    <div className="min-h-full p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Community Gallery</h1>
            <p className="text-muted-foreground">Explore AI-generated artwork from the community</p>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            {data?.total ?? 0} artworks
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data?.items.length ? (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">No images yet</h3>
            <p className="text-muted-foreground text-sm">Be the first to share your AI creations!</p>
          </div>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {data.items.map((item) => (
                <div key={item.id} className="break-inside-avoid group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all">
                  <img
                    src={item.imageUrl}
                    alt={item.title ?? "AI Generated"}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs line-clamp-2 mb-2">{item.prompt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
                            {item.userName?.[0]?.toUpperCase() ?? "A"}
                          </div>
                          <span className="text-white text-xs">{item.userName ?? "Anonymous"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (!isAuthenticated) { toast.error("Sign in to like"); return; }
                              likeMutation.mutate({ galleryItemId: item.id });
                            }}
                            className={`flex items-center gap-1 text-xs transition-colors ${likedIds.has(item.id) ? "text-red-400" : "text-white/80 hover:text-red-400"}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${likedIds.has(item.id) ? "fill-current" : ""}`} />
                            {item.likes}
                          </button>
                          <a
                            href={item.imageUrl}
                            download
                            target="_blank"
                            className="text-white/80 hover:text-white transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Style badge */}
                  {item.style && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-0">
                        {item.style}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.total > 20 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(data.total / 20)}
                </span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
