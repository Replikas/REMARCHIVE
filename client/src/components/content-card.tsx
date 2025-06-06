import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Heart, MessageCircle, Bookmark, BookOpen, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContentCardProps {
  fanwork: any;
  viewMode?: "grid" | "list";
  showAuthor?: boolean;
  showDeleteButton?: boolean;
}

export default function ContentCard({ 
  fanwork, 
  viewMode = "grid", 
  showAuthor = true,
  showDeleteButton = false
}: ContentCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: interactions } = useQuery({
    queryKey: ["/api/fanworks", fanwork.id, "interactions"],
    enabled: isAuthenticated,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/fanworks/${fanwork.id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks", fanwork.id, "interactions"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to toggle like",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/fanworks/${fanwork.id}/bookmark`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks", fanwork.id, "interactions"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to toggle bookmark",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/fanworks/${fanwork.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/liked-fanworks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookmarked-fanworks"] });
      toast({
        title: "Success",
        description: "Fanwork deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete fanwork",
        variant: "destructive",
      });
    },
  });

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "all-ages": return "bg-blue-600";
      case "teen": return "bg-green-600";
      case "mature": return "bg-yellow-600";
      case "explicit": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to like fanworks",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to bookmark fanworks",
        variant: "destructive",
      });
      return;
    }
    bookmarkMutation.mutate();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this fanwork? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="content-card overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {fanwork.type === "artwork" || fanwork.type === "comic" ? (
              <div className="w-24 h-24 flex-shrink-0">
                {fanwork.imageUrl ? (
                  <img 
                    src={fanwork.imageUrl} 
                    alt={fanwork.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-dark-elevated rounded flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">No Image</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-portal-blue/20 to-neon-green/20 rounded flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-portal-blue" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg text-foreground truncate">{fanwork.title}</h3>
                <Badge className={`${getRatingColor(fanwork.rating)} text-white text-xs`}>
                  {fanwork.rating.replace("-", " ")}
                </Badge>
              </div>

              {showAuthor && fanwork.author && (
                <p className="text-muted-foreground text-sm mb-2">
                  by {fanwork.author.firstName || fanwork.author.lastName 
                    ? `${fanwork.author.firstName || ""} ${fanwork.author.lastName || ""}`.trim()
                    : "Anonymous"
                  }
                </p>
              )}

              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {fanwork.description || "No description available"}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {fanwork.tags?.slice(0, 3).map((tag: any) => (
                    <Badge 
                      key={tag.id} 
                      variant="secondary" 
                      className="tag-chip text-xs"
                    >
                      #{tag.name}
                    </Badge>
                  ))}
                  {fanwork.tags?.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{fanwork.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                    className={`p-0 h-auto ${interactions?.isLiked ? "text-red-500" : ""}`}
                  >
                    <Heart 
                      className={`h-4 w-4 mr-1 ${interactions?.isLiked ? "fill-current" : ""}`} 
                    />
                    {fanwork.counts?.likes || 0}
                  </Button>
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {fanwork.counts?.comments || 0}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBookmark}
                    disabled={bookmarkMutation.isPending}
                    className={`p-0 h-auto ${interactions?.isBookmarked ? "text-neon-green" : ""}`}
                  >
                    <Bookmark 
                      className={`h-4 w-4 mr-1 ${interactions?.isBookmarked ? "fill-current" : ""}`} 
                    />
                    {fanwork.counts?.bookmarks || 0}
                  </Button>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDistanceToNow(new Date(fanwork.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="content-card overflow-hidden">
      {fanwork.type === "artwork" || fanwork.type === "comic" ? (
        fanwork.imageUrl ? (
          <img 
            src={fanwork.imageUrl} 
            alt={fanwork.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-dark-elevated flex items-center justify-center">
            <span className="text-muted-foreground">No Image Available</span>
          </div>
        )
      ) : (
        <div className="h-32 bg-gradient-to-br from-portal-blue/20 to-neon-green/20 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-8 w-8 text-portal-blue mx-auto mb-2" />
            <span className="text-sm text-muted-foreground">Fanfiction</span>
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg leading-tight text-foreground">
            {fanwork.title}
          </h3>
          <Badge className={`${getRatingColor(fanwork.rating)} text-white text-xs ml-2`}>
            {fanwork.rating.replace("-", " ")}
          </Badge>
        </div>

        {showAuthor && fanwork.author && (
          <p className="text-muted-foreground text-sm mb-3">
            by {fanwork.author.firstName || fanwork.author.lastName 
              ? `${fanwork.author.firstName || ""} ${fanwork.author.lastName || ""}`.trim()
              : "Anonymous"
            }
          </p>
        )}

        <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
          {fanwork.description || "No description available"}
        </p>

        {fanwork.type === "fanfiction" && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            {fanwork.wordCount && (
              <span>{fanwork.wordCount.toLocaleString()} words</span>
            )}
            {fanwork.chapterCount && (
              <span>{fanwork.chapterCount} chapters</span>
            )}
            {fanwork.isComplete && (
              <Badge variant="secondary" className="text-xs">Complete</Badge>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {fanwork.tags?.slice(0, 4).map((tag: any) => (
            <Badge 
              key={tag.id} 
              variant="secondary" 
              className="tag-chip text-xs"
            >
              #{tag.name}
            </Badge>
          ))}
          {fanwork.tags?.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{fanwork.tags.length - 4}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`p-0 h-auto hover:text-red-500 ${interactions?.isLiked ? "text-red-500" : ""}`}
            >
              <Heart 
                className={`h-4 w-4 mr-1 ${interactions?.isLiked ? "fill-current" : ""}`} 
              />
              {fanwork.counts?.likes || 0}
            </Button>
            <span className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              {fanwork.counts?.comments || 0}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              disabled={bookmarkMutation.isPending}
              className={`p-0 h-auto hover:text-neon-green ${interactions?.isBookmarked ? "text-neon-green" : ""}`}
            >
              <Bookmark 
                className={`h-4 w-4 mr-1 ${interactions?.isBookmarked ? "fill-current" : ""}`} 
              />
              {fanwork.counts?.bookmarks || 0}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span>{formatDistanceToNow(new Date(fanwork.createdAt), { addSuffix: true })}</span>
            {showDeleteButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="p-0 h-auto hover:text-red-500 text-muted-foreground"
                title="Delete fanwork"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
