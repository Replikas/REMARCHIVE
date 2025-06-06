import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileImage, BookOpen, X, Loader2 } from "lucide-react";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().optional(),
  type: z.enum(["artwork", "fanfiction", "comic"]),
  rating: z.enum(["all-ages", "teen", "mature", "explicit"]),
  content: z.string().optional(),
  wordCount: z.number().optional(),
  chapterCount: z.number().optional(),
  isComplete: z.boolean().default(false),
  tags: z.string(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "artwork",
      rating: "all-ages",
      content: "",
      wordCount: undefined,
      chapterCount: undefined,
      isComplete: false,
      tags: "",
    },
  });

  const watchedType = form.watch("type");

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (!isAuthenticated) {
        throw new Error("You must be logged in to upload");
      }

      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await apiRequest("POST", "/api/fanworks", formData);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your fanwork has been uploaded successfully!",
        className: "bg-dark-surface border-neon-green text-foreground",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks"] });
      handleClose();
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
        title: "Upload Failed",
        description: error.message || "Failed to upload fanwork. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPEG, PNG, GIF, or WebP)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    setDragOver(false);
    onOpenChange(false);
  };

  const onSubmit = (data: UploadFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to upload fanworks",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    // Validate file requirement for artwork/comic
    if ((data.type === "artwork" || data.type === "comic") && !selectedFile) {
      toast({
        title: "Image Required",
        description: `An image file is required for ${data.type}`,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(data);
  };

  // Check authentication when modal opens
  if (open && !isAuthenticated) {
    toast({
      title: "Login Required",
      description: "Please log in to upload fanworks",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-surface border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-neon-green flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload New Fanwork
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter fanwork title..." 
                          className="bg-dark-elevated border-border text-foreground placeholder:text-muted-foreground focus:border-neon-green"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Content Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-dark-elevated border-border text-foreground focus:border-neon-green">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-dark-surface border-border">
                          <SelectItem value="artwork" className="text-foreground hover:bg-dark-elevated">
                            <div className="flex items-center gap-2">
                              <FileImage className="h-4 w-4" />
                              Artwork
                            </div>
                          </SelectItem>
                          <SelectItem value="fanfiction" className="text-foreground hover:bg-dark-elevated">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Fanfiction
                            </div>
                          </SelectItem>
                          <SelectItem value="comic" className="text-foreground hover:bg-dark-elevated">
                            <div className="flex items-center gap-2">
                              <FileImage className="h-4 w-4" />
                              Comic
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Content Rating *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-dark-elevated border-border text-foreground focus:border-neon-green">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-dark-surface border-border">
                          <SelectItem value="all-ages" className="text-foreground hover:bg-dark-elevated">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              All Ages
                            </span>
                          </SelectItem>
                          <SelectItem value="teen" className="text-foreground hover:bg-dark-elevated">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                              Teen+
                            </span>
                          </SelectItem>
                          <SelectItem value="mature" className="text-foreground hover:bg-dark-elevated">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                              Mature
                            </span>
                          </SelectItem>
                          <SelectItem value="explicit" className="text-foreground hover:bg-dark-elevated">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                              Explicit
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Tags (comma-separated)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="rickorty, angst, hurt-comfort..."
                          className="bg-dark-elevated border-border text-foreground placeholder:text-muted-foreground focus:border-neon-green"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                {(watchedType === "artwork" || watchedType === "comic") && (
                  <div>
                    <FormLabel className="text-foreground">Image Upload *</FormLabel>
                    <div
                      className={`upload-area rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        dragOver ? "border-portal-blue bg-portal-blue/10" : ""
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileSelect(file);
                        };
                        input.click();
                      }}
                    >
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{selectedFile.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      ) : (
                        <>
                          <FileImage className="h-12 w-12 text-neon-green mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground mb-3">
                            Drag & drop an image or{" "}
                            <span className="text-neon-green cursor-pointer hover:underline">
                              browse files
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPEG, PNG, GIF, WebP up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {watchedType === "fanfiction" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="wordCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Word Count</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="0"
                                className="bg-dark-elevated border-border text-foreground placeholder:text-muted-foreground focus:border-neon-green"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="chapterCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Chapters</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="1"
                                className="bg-dark-elevated border-border text-foreground placeholder:text-muted-foreground focus:border-neon-green"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isComplete"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-neon-green data-[state=checked]:border-neon-green"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-foreground cursor-pointer">
                              Mark as Complete
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your fanwork..."
                      className="bg-dark-elevated border-border text-foreground placeholder:text-muted-foreground min-h-[100px] focus:border-neon-green"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedType === "fanfiction" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Story Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Paste your story here..."
                        className="bg-dark-elevated border-border text-foreground placeholder:text-muted-foreground min-h-[200px] font-mono focus:border-neon-green"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={uploadMutation.isPending}
                className="border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadMutation.isPending}
                className="bg-neon-green text-dark-bg hover:bg-neon-green/90 glow-neon"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Fanwork
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
