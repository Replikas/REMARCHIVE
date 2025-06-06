import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useLocation } from "wouter";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileImage, BookOpen, X } from "lucide-react";

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

export default function UploadPage() {
  const [, setLocation] = useLocation();
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
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      return await apiRequest("POST", "/api/fanworks", formData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your fanwork has been uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fanworks"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
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

  const onSubmit = (data: UploadFormData) => {
    uploadMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-neon-green flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Upload New Fanwork
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter fanwork title..." 
                              className="bg-dark-elevated border-border"
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
                          <FormLabel>Content Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-dark-elevated border-border">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="artwork">
                                <div className="flex items-center gap-2">
                                  <FileImage className="h-4 w-4" />
                                  Artwork
                                </div>
                              </SelectItem>
                              <SelectItem value="fanfiction">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  Fanfiction
                                </div>
                              </SelectItem>
                              <SelectItem value="comic">
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
                          <FormLabel>Content Rating *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-dark-elevated border-border">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all-ages">All Ages</SelectItem>
                              <SelectItem value="teen">Teen+</SelectItem>
                              <SelectItem value="mature">Mature</SelectItem>
                              <SelectItem value="explicit">Explicit</SelectItem>
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
                          <FormLabel>Tags (comma-separated)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="rickorty, angst, hurt-comfort..."
                              className="bg-dark-elevated border-border"
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
                        <FormLabel>Image Upload *</FormLabel>
                        <div
                          className={`upload-area rounded-lg p-6 text-center transition-colors ${
                            dragOver ? "border-portal-blue bg-portal-blue/10" : ""
                          }`}
                          onDrop={handleDrop}
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                        >
                          {selectedFile ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground">{selectedFile.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedFile(null)}
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
                                <label className="text-neon-green cursor-pointer hover:underline">
                                  browse files
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileSelect(file);
                                    }}
                                  />
                                </label>
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
                                <FormLabel>Word Count</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    className="bg-dark-elevated border-border"
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
                                <FormLabel>Chapters</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    placeholder="1"
                                    className="bg-dark-elevated border-border"
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
                                <FormLabel>Mark as Complete</FormLabel>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your fanwork..."
                          className="bg-dark-elevated border-border min-h-[100px]"
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
                        <FormLabel>Story Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste your story here..."
                            className="bg-dark-elevated border-border min-h-[300px] font-mono"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={uploadMutation.isPending}
                    className="bg-neon-green text-dark-bg hover:bg-neon-green/90"
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload Fanwork"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
