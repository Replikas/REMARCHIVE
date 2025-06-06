import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Heart, MessageCircle, Bookmark, BookOpen, Clock, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import Header from "@/components/header";

function getRatingColor(rating: string) {
  switch (rating) {
    case "general":
      return "bg-green-600";
    case "teen":
      return "bg-yellow-600";
    case "mature":
      return "bg-orange-600";
    case "explicit":
      return "bg-red-600";
    default:
      return "bg-gray-600";
  }
}

export default function FanworkDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  const { data: fanwork, isLoading: isLoadingFanwork } = useQuery({
    queryKey: ["/api/fanworks", id],
    queryFn: () => apiRequest(`/api/fanworks/${id}`),
    retry: false,
  });

  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ["/api/fanworks", id, "comments"],
    queryFn: () => apiRequest(`/api/fanworks/${id}/comments`),
    retry: false,
  });

  const { data: interactions } = useQuery({
    queryKey: ["/api/fanworks", id, "interactions"],
    enabled: isAuthenticated,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: () => apiRequest(`/api/fanworks/${id}/like`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks", id, "interactions"] });
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
    mutationFn: () => apiRequest(`/api/fanworks/${id}/bookmark`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks", id, "interactions"] });
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

  const commentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest(`/api/fanworks/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks", id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks", id] });
      setCommentText("");
      toast({
        title: "Success",
        description: "Comment posted successfully",
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
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to like fanworks",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to bookmark fanworks",
        variant: "destructive",
      });
      return;
    }
    bookmarkMutation.mutate();
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to comment",
        variant: "destructive",
      });
      return;
    }
    if (!commentText.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }
    commentMutation.mutate(commentText.trim());
  };

  if (isLoadingFanwork) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!fanwork) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">Fanwork not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </Link>

        {/* Main Content */}
        <Card className="bg-dark-surface border-border mb-8">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{fanwork.title}</h1>
                {fanwork.author && (
                  <p className="text-muted-foreground text-lg mb-4">
                    by {fanwork.author.firstName || fanwork.author.lastName 
                      ? `${fanwork.author.firstName || ""} ${fanwork.author.lastName || ""}`.trim()
                      : "Anonymous"
                    }
                  </p>
                )}
              </div>
              <Badge className={`${getRatingColor(fanwork.rating)} text-white`}>
                {fanwork.rating.replace("-", " ")}
              </Badge>
            </div>

            {/* Image/Content */}
            {fanwork.type === "artwork" || fanwork.type === "comic" ? (
              fanwork.imageUrl ? (
                <div className="mb-6">
                  <img 
                    src={fanwork.imageUrl} 
                    alt={fanwork.title}
                    className="w-full max-h-96 object-contain rounded-lg bg-dark-elevated"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-dark-elevated rounded-lg flex items-center justify-center mb-6">
                  <span className="text-muted-foreground">No Image Available</span>
                </div>
              )
            ) : (
              <div className="h-32 bg-gradient-to-br from-portal-blue/20 to-neon-green/20 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-portal-blue mx-auto mb-2" />
                  <span className="text-lg text-muted-foreground">Fanfiction</span>
                </div>
              </div>
            )}

            {/* Description */}
            {fanwork.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{fanwork.description}</p>
              </div>
            )}

            {/* Content for fanfiction */}
            {fanwork.type === "fanfiction" && fanwork.content && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Story</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{fanwork.content}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {fanwork.tags && fanwork.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {fanwork.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-dark-elevated text-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stats and Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {fanwork.type === "fanfiction" && fanwork.wordCount && (
                  <span>{fanwork.wordCount.toLocaleString()} words</span>
                )}
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDistanceToNow(new Date(fanwork.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  className={`text-muted-foreground hover:text-foreground ${
                    interactions?.isLiked ? "text-red-500 hover:text-red-400" : ""
                  }`}
                >
                  <Heart 
                    className={`h-4 w-4 mr-1 ${interactions?.isLiked ? "fill-current" : ""}`} 
                  />
                  {fanwork.counts?.likes || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {fanwork.counts?.comments || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={bookmarkMutation.isPending}
                  className={`text-muted-foreground hover:text-foreground ${
                    interactions?.isBookmarked ? "text-yellow-500 hover:text-yellow-400" : ""
                  }`}
                >
                  <Bookmark 
                    className={`h-4 w-4 mr-1 ${interactions?.isBookmarked ? "fill-current" : ""}`} 
                  />
                  {fanwork.counts?.bookmarks || 0}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="bg-dark-surface border-border">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Comments ({comments.length})
            </h2>

            {/* Add Comment */}
            {isAuthenticated && (
              <div className="mb-6">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="bg-dark-elevated border-border text-foreground mb-3"
                  rows={3}
                />
                <Button 
                  onClick={handleComment}
                  disabled={commentMutation.isPending || !commentText.trim()}
                  className="bg-neon-green text-dark-bg hover:bg-neon-green/90"
                >
                  {commentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center text-muted-foreground py-8">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No comments yet. {isAuthenticated ? "Be the first to comment!" : "Login to comment."}
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-dark-elevated rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author?.avatarUrl} />
                      <AvatarFallback className="bg-neon-green text-dark-bg text-xs">
                        {comment.author?.firstName?.[0] || comment.author?.lastName?.[0] || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground text-sm">
                          {comment.author?.firstName || comment.author?.lastName 
                            ? `${comment.author.firstName || ""} ${comment.author.lastName || ""}`.trim()
                            : "Anonymous"
                          }
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}