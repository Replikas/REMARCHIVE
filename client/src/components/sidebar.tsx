import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudUpload } from "lucide-react";

interface SidebarProps {
  filters: {
    type: string[];
    rating: string[];
    tags: string[];
    search: string;
  };
  onFilterChange: (filters: any) => void;
  onUpload?: () => void;
  showUpload?: boolean;
}

const contentTypes = [
  { value: "artwork", label: "Artwork" },
  { value: "fanfiction", label: "Fanfiction" },
  { value: "comic", label: "Comics" },
];

const ratings = [
  { value: "all-ages", label: "All Ages" },
  { value: "teen", label: "Teen+" },
  { value: "mature", label: "Mature" },
  { value: "explicit", label: "Explicit" },
];

const popularTags = [
  "rickorty", "angst", "fluff", "alternate-universe", 
  "hurt-comfort", "smut", "dimension-c137", "slow-burn",
  "science", "adventure", "romance", "dark"
];

export default function Sidebar({ 
  filters, 
  onFilterChange, 
  onUpload, 
  showUpload = true 
}: SidebarProps) {
  const handleTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked 
      ? [...filters.type, type]
      : filters.type.filter(t => t !== type);
    onFilterChange({ type: newTypes });
  };

  const handleRatingChange = (rating: string, checked: boolean) => {
    const newRatings = checked 
      ? [...filters.rating, rating]
      : filters.rating.filter(r => r !== rating);
    onFilterChange({ rating: newRatings });
  };

  const handleTagClick = (tag: string) => {
    const isSelected = filters.tags.includes(tag);
    const newTags = isSelected
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFilterChange({ tags: newTags });
  };

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="space-y-6">
        {/* Content Type Filter */}
        <Card className="bg-dark-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-neon-green">Content Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contentTypes.map((type) => (
              <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.type.includes(type.value)}
                  onCheckedChange={(checked) => handleTypeChange(type.value, checked as boolean)}
                  className="data-[state=checked]:bg-neon-green data-[state=checked]:border-neon-green"
                />
                <span className="text-muted-foreground flex-1">{type.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Rating Filter */}
        <Card className="bg-dark-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-portal-blue">Rating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ratings.map((rating) => (
              <label key={rating.value} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.rating.includes(rating.value)}
                  onCheckedChange={(checked) => handleRatingChange(rating.value, checked as boolean)}
                  className="data-[state=checked]:bg-portal-blue data-[state=checked]:border-portal-blue"
                />
                <span className="text-muted-foreground">{rating.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Popular Tags */}
        <Card className="bg-dark-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-warning-amber">Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.tags.includes(tag) ? "default" : "secondary"}
                  className={`tag-chip cursor-pointer ${
                    filters.tags.includes(tag)
                      ? "bg-neon-green text-dark-bg border-neon-green"
                      : "bg-transparent text-muted-foreground border-muted-foreground hover:border-neon-green hover:text-neon-green"
                  }`}
                  onClick={() => handleTagClick(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        {showUpload && onUpload && (
          <Card className="bg-dark-surface border-border">
            <CardContent className="upload-area rounded-lg p-6 text-center">
              <CloudUpload className="h-8 w-8 text-neon-green mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Share your creations</p>
              <Button 
                onClick={onUpload}
                className="bg-neon-green text-dark-bg hover:bg-neon-green/90 w-full"
              >
                Upload Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Clear Filters */}
        {(filters.type.length > 0 || filters.rating.length > 0 || filters.tags.length > 0) && (
          <Button
            variant="outline"
            onClick={() => onFilterChange({ type: [], rating: [], tags: [] })}
            className="w-full border-muted-foreground text-muted-foreground hover:border-neon-green hover:text-neon-green"
          >
            Clear All Filters
          </Button>
        )}
      </div>
    </aside>
  );
}
