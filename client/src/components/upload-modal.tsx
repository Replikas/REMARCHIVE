import React, { useState } from "react";
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
// @ts-ignore
import { Upload, FileImage, BookOpen, X, Loader2, ExternalLink } from "lucide-react";
import AO3Import from "./ao3-import";

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
  const [importMode, setImportMode] = useState<'manual' | 'ao3'>('manual');
  const [watchedType, setWatchedType] = useState<string>("");

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

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData & { file?: File }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'file' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      return apiRequest('/api/fanworks', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your fanwork has been uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['fanworks'] });
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upload fanworks.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload fanwork. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (data: UploadFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload fanworks.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ ...data, file: selectedFile || undefined });
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
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

  const handleAO3Import = (data: any) => {
    form.setValue('title', data.title || '');
    form.setValue('description', data.description || '');
    form.setValue('wordCount', data.wordCount);
    form.setValue('chapterCount', data.chapterCount);
    form.setValue('isComplete', data.isComplete || false);
    form.setValue('tags', data.tags || '');
  };

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.type) {
        setWatchedType(value.type);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-dark-bg border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload Fanwork</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter title..."
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
                    <FormLabel className="text-foreground">Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-dark-elevated border-border text-foreground focus:border-neon-green">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-dark-elevated border-border">
                        <SelectItem value="artwork" className="text-foreground hover:bg-dark-surface">Artwork</SelectItem>
                        <SelectItem value="fanfiction" className="text-foreground hover:bg-dark-surface">Fanfiction</SelectItem>
                        <SelectItem value="comic" className="text-foreground hover:bg-dark-surface">Comic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Rating *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-dark-elevated border-border text-foreground focus:border-neon-green">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-elevated border-border">
                      <SelectItem value="all-ages" className="text-foreground hover:bg-dark-surface">All Ages</SelectItem>
                      <SelectItem value="teen" className="text-foreground hover:bg-dark-surface">Teen</SelectItem>
                      <SelectItem value="mature" className="text-foreground hover:bg-dark-surface">Mature</SelectItem>
                      <SelectItem value="explicit" className="text-foreground hover:bg-dark-surface">Explicit</SelectItem>
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
                  <FormLabel className="text-foreground">Tags</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter tags separated by commas..."
                      className="bg-dark-elevated border-border text-foreground placeholder:text-muted-foreground focus:border-neon-green"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                <div>
                  {/* Import Mode Toggle */}
                  <div className="flex gap-2 p-1 bg-dark-surface rounded-lg mb-4">
                    <Button
                      type="button"
                      variant={importMode === 'manual' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setImportMode('manual')}
                      className={`flex-1 ${importMode === 'manual' ? 'bg-neon-green text-dark-bg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manual Entry
                    </Button>
                    <Button
                      type="button"
                      variant={importMode === 'ao3' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setImportMode('ao3')}
                      className={`flex-1 ${importMode === 'ao3' ? 'bg-neon-green text-dark-bg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Import from AO3
                    </Button>
                  </div>

                  {importMode === 'ao3' ? (
                    <AO3Import onImport={handleAO3Import} />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              )}
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

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-dark-surface"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={uploadMutation.isPending}
                className="bg-neon-green text-dark-bg hover:bg-neon-green/90"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
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