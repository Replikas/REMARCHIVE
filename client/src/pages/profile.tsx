import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import ContentCard from "@/components/content-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileImage, BookOpen, Heart, Bookmark, MessageCircle, Calendar } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("uploads");

  const { data: userFanworks = [], isLoading: isLoadingFanworks } = useQuery({
    queryKey: ["/api/fanworks", { authorId: user?.id }],
    enabled: !!user?.id,
    retry: false,
  });

  const { data: likedFanworks = [], isLoading: isLoadingLiked } = useQuery({
    queryKey: ["/api/user/liked-fanworks"],
    enabled: !!user?.id && activeTab === "liked",
    retry: false,
  });

  const { data: bookmarkedFanworks = [], isLoading: isLoadingBookmarked } = useQuery({
    queryKey: ["/api/user/bookmarked-fanworks"],
    enabled: !!user?.id && activeTab === "bookmarked",
    retry: false,
  });

  if (!user) return null;

  const getStats = () => {
    const artworkCount = userFanworks.filter((w: any) => w.type === "artwork").length;
    const fanfictionCount = userFanworks.filter((w: any) => w.type === "fanfiction").length;
    const totalLikes = userFanworks.reduce((sum: number, w: any) => sum + (w.counts?.likes || 0), 0);
    const totalComments = userFanworks.reduce((sum: number, w: any) => sum + (w.counts?.comments || 0), 0);

    return {
      artworkCount,
      fanfictionCount,
      totalLikes,
      totalComments,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="bg-dark-surface border-border mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.profileImageUrl || ""} />
                <AvatarFallback className="bg-neon-green text-dark-bg text-2xl">
                  {user.firstName?.[0] || user.email?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  }
                </h1>
                
                <div className="flex items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-green">{stats.artworkCount}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <FileImage className="h-4 w-4" />
                      Artworks
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-portal-blue">{stats.fanfictionCount}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Fanfictions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-amber">{stats.totalLikes}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Heart className="h-4 w-4" />
                      Total Likes
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.totalComments}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      Comments
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.href = '/api/logout'}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-dark-surface border-border mb-6">
            <TabsTrigger value="uploads" className="data-[state=active]:bg-neon-green data-[state=active]:text-dark-bg">
              My Uploads ({userFanworks.length})
            </TabsTrigger>
            <TabsTrigger value="liked" className="data-[state=active]:bg-neon-green data-[state=active]:text-dark-bg">
              Liked
            </TabsTrigger>
            <TabsTrigger value="bookmarked" className="data-[state=active]:bg-neon-green data-[state=active]:text-dark-bg">
              Bookmarked
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploads">
            {isLoadingFanworks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-dark-surface rounded-lg h-80 animate-pulse" />
                ))}
              </div>
            ) : userFanworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userFanworks.map((fanwork: any) => (
                  <ContentCard 
                    key={fanwork.id} 
                    fanwork={fanwork} 
                    viewMode="grid"
                    showAuthor={false}
                    showDeleteButton={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-muted-foreground text-lg mb-4">
                  You haven't uploaded any fanworks yet
                </div>
                <Button 
                  onClick={() => window.location.href = '/upload'}
                  className="bg-neon-green text-dark-bg hover:bg-neon-green/90"
                >
                  Upload Your First Fanwork
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked">
            {isLoadingLiked ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-dark-surface rounded-lg h-80 animate-pulse" />
                ))}
              </div>
            ) : likedFanworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedFanworks.map((fanwork: any) => (
                  <ContentCard 
                    key={fanwork.id} 
                    fanwork={fanwork} 
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-muted-foreground text-lg">
                  You haven't liked any fanworks yet
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarked">
            {isLoadingBookmarked ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-dark-surface rounded-lg h-80 animate-pulse" />
                ))}
              </div>
            ) : bookmarkedFanworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedFanworks.map((fanwork: any) => (
                  <ContentCard 
                    key={fanwork.id} 
                    fanwork={fanwork} 
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-muted-foreground text-lg">
                  You haven't bookmarked any fanworks yet
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
