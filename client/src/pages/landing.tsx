import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Atom, FileImage, BookOpen, Users } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-bg text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-neon-green rounded-full flex items-center justify-center">
                <Atom className="text-dark-bg h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-neon-green">Rickorty Archive</span>
            </div>
            <Link href="/login">
              <Button className="bg-neon-green text-dark-bg hover:bg-neon-green/90 glow-neon">
                Enter Archive
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-neon-green">Underground</span>{" "}
            <span className="text-portal-blue">Fanworks</span>{" "}
            <span className="text-foreground">Vault</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The uncensored archive for Rick x Morty fanworks. Upload, browse, and interact with 
            fan-made content without judgment. Think AO3 meets underground art vault, Rick-style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg"
                className="bg-neon-green text-dark-bg hover:bg-neon-green/90 glow-neon"
              >
                Join the Archive
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                variant="outline" 
                size="lg"
                className="border-portal-blue text-portal-blue hover:bg-portal-blue hover:text-white"
              >
                Already have account?
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-dark-surface border-border content-card">
            <CardContent className="p-6 text-center">
              <FileImage className="h-12 w-12 text-neon-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-neon-green">Artwork Gallery</h3>
              <p className="text-muted-foreground">
                Upload and browse high-quality fan art with support for all content ratings.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface border-border content-card">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-portal-blue mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-portal-blue">Fanfiction Archive</h3>
              <p className="text-muted-foreground">
                Share and discover stories across all genres and dimensions.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-surface border-border content-card">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-warning-amber mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-warning-amber">Community Features</h3>
              <p className="text-muted-foreground">
                Connect with creators through comments, likes, and collections.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Community Section */}
        <div className="bg-dark-surface rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-6 text-neon-green">Join the Community</h2>
          <p className="text-muted-foreground mb-6">
            Be part of the growing Rick and Morty fanworks community. Upload your creations, 
            discover amazing content, and connect with fellow fans across the multiverse.
          </p>
          <Link href="/register">
            <Button className="bg-neon-green text-dark-bg hover:bg-neon-green/90 glow-neon">
              Start Creating Today
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            <p>© 2025 Rickorty Archive. All content belongs to respective creators.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
