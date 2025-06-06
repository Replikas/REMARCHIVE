import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AO3ImportProps {
  onImport: (data: {
    title: string;
    content: string;
    description?: string;
    tags: string;
    wordCount?: number;
    chapterCount?: number;
    rating: string;
  }) => void;
}

interface AO3WorkData {
  title: string;
  content: string;
  description?: string;
  tags: string[];
  wordCount?: number;
  chapterCount?: number;
  rating: string;
  author: string;
  summary?: string;
}

export default function AO3Import({ onImport }: AO3ImportProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<AO3WorkData | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const validateAO3Url = (url: string): boolean => {
    const ao3Pattern = /^https?:\/\/(www\.)?archiveofourown\.org\/works\/\d+/;
    return ao3Pattern.test(url);
  };

  const extractWorkId = (url: string): string | null => {
    const match = url.match(/\/works\/(\d+)/);
    return match ? match[1] : null;
  };

  const mapAO3Rating = (ao3Rating: string): string => {
    const ratingMap: { [key: string]: string } = {
      "General Audiences": "all-ages",
      "Teen And Up Audiences": "teen",
      "Mature": "mature",
      "Explicit": "explicit",
      "Not Rated": "all-ages"
    };
    return ratingMap[ao3Rating] || "all-ages";
  };

  const fetchAO3Work = async (workUrl: string): Promise<AO3WorkData> => {
    // Since we can't directly fetch from AO3 due to CORS, we'll use a proxy approach
    // For now, we'll simulate the parsing and ask users to manually paste content
    
    // In a real implementation, you would:
    // 1. Use a backend proxy to fetch the AO3 page
    // 2. Parse the HTML to extract metadata and content
    // 3. Handle authentication if the work is restricted
    
    throw new Error("Direct AO3 import requires manual content pasting due to CORS restrictions.");
  };

  const parseManualContent = (content: string): Partial<AO3WorkData> => {
    // Basic parsing for manually pasted AO3 content
    const lines = content.split('\n');
    let title = "";
    let description = "";
    let tags: string[] = [];
    let textContent = content;
    
    // Try to extract title from first line if it looks like a title
    if (lines[0] && lines[0].length < 200 && !lines[0].includes('.')) {
      title = lines[0].trim();
      textContent = lines.slice(1).join('\n').trim();
    }
    
    return {
      title,
      content: textContent,
      description,
      tags,
    };
  };

  const handleUrlImport = async () => {
    if (!url) {
      setError("Please enter an AO3 URL");
      return;
    }

    if (!validateAO3Url(url)) {
      setError("Please enter a valid AO3 work URL (e.g., https://archiveofourown.org/works/12345)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const workData = await fetchAO3Work(url);
      setPreviewData(workData);
    } catch (err) {
      setError("Unable to automatically import from AO3. Please use manual import instead.");
      toast({
        title: "Import Failed",
        description: "Due to technical limitations, please copy and paste your story content manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualImport = (manualContent: string) => {
    if (!manualContent.trim()) {
      setError("Please paste your story content");
      return;
    }

    const parsed = parseManualContent(manualContent);
    const workData: AO3WorkData = {
      title: parsed.title || "Imported Story",
      content: parsed.content || manualContent,
      description: parsed.description,
      tags: parsed.tags || [],
      rating: "all-ages",
      author: "Unknown",
      wordCount: manualContent.split(/\s+/).length,
      chapterCount: 1,
    };

    setPreviewData(workData);
    setError("");
  };

  const handleImport = () => {
    if (!previewData) return;

    onImport({
      title: previewData.title,
      content: previewData.content,
      description: previewData.description || previewData.summary,
      tags: previewData.tags.join(", "),
      wordCount: previewData.wordCount,
      chapterCount: previewData.chapterCount,
      rating: previewData.rating,
    });

    // Reset state
    setPreviewData(null);
    setUrl("");
    setError("");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-elevated border-border">
        <CardHeader>
          <CardTitle className="text-neon-green flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Import from Archive of Our Own
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Import fanfiction directly from AO3 or paste content manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Import Section */}
          <div className="space-y-2">
            <Label className="text-foreground">AO3 Work URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://archiveofourown.org/works/12345"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-dark-surface border-border text-foreground placeholder:text-muted-foreground focus:border-neon-green"
              />
              <Button
                onClick={handleUrlImport}
                disabled={isLoading}
                className="bg-neon-green text-dark-bg hover:bg-neon-green/90"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Manual Import Section */}
          <div className="space-y-2">
            <Label className="text-foreground">Or paste story content manually</Label>
            <Textarea
              placeholder="Paste your fanfiction content here...\n\nTip: Include the title on the first line for automatic detection"
              className="bg-dark-surface border-border text-foreground placeholder:text-muted-foreground min-h-[150px] font-mono focus:border-neon-green"
              onChange={(e) => {
                if (e.target.value.trim()) {
                  handleManualImport(e.target.value);
                }
              }}
            />
          </div>

          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {previewData && (
        <Card className="bg-dark-elevated border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Import Preview</CardTitle>
            <CardDescription className="text-muted-foreground">
              Review the imported content before adding to your archive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Title</Label>
                <p className="text-foreground font-medium">{previewData.title}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Word Count</Label>
                <p className="text-foreground">{previewData.wordCount?.toLocaleString() || 'Unknown'}</p>
              </div>
            </div>

            {previewData.tags.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Tags</Label>
                <p className="text-foreground">{previewData.tags.join(", ")}</p>
              </div>
            )}

            {previewData.description && (
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-foreground text-sm">{previewData.description}</p>
              </div>
            )}

            <div>
              <Label className="text-sm text-muted-foreground">Content Preview</Label>
              <div className="bg-dark-surface border border-border rounded p-3 max-h-32 overflow-y-auto">
                <p className="text-foreground text-sm font-mono whitespace-pre-wrap">
                  {previewData.content.substring(0, 500)}
                  {previewData.content.length > 500 && "..."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewData(null);
                  setError("");
                }}
                className="border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                className="bg-neon-green text-dark-bg hover:bg-neon-green/90 glow-neon"
              >
                Import Story
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}