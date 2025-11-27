import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Search, Filter, Plus, Edit, Trash2, CheckCircle2, Image as ImageIcon, X, Eye } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichEditor from "@/components/RichEditor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { adminBlogApi, type BlogPost } from "@/services/adminBlogApi";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const statusBadgeClass: Record<BlogPost["status"], string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  published: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  archived: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
};

const News = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<BlogPost["status"]>("draft");
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const params = filterStatus === "all" ? {} : { status: filterStatus };
      const data = await adminBlogApi.list(params);
      setPosts(data);
    } catch (error) {
      toast({
        title: "Unable to load posts",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return posts.filter((post) =>
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author_name?.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      setIsDeleting(post.id);
      await adminBlogApi.delete(post.id);
      toast({ title: "Post deleted" });
      loadPosts();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStatusChange = async (post: BlogPost, status: BlogPost["status"]) => {
    try {
      await adminBlogApi.update(post.id, { status });
      toast({ title: `Post ${status === "published" ? "published" : "updated"}` });
      loadPosts();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const openCreateEditor = () => {
    setEditingPost(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setStatus("draft");
    setFeaturedImageFile(null);
    setFeaturedImagePreview(null);
    setIsEditorOpen(true);
  };

  const openEditEditor = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title || "");
    setSlug(post.slug || "");
    setExcerpt(post.excerpt || "");
    setContent(post.content || "");
    setStatus(post.status);
    setFeaturedImageFile(null);
    setFeaturedImagePreview(post.featured_image_url || null);
    setIsEditorOpen(true);
  };

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  useEffect(() => {
    if (!editingPost) {
      // Auto-generate slug for new posts only if user hasn't typed a custom slug
      setSlug((prev) => (prev ? prev : toSlug(title)));
    }
  }, [title, editingPost]);

  const onPickImage = () => {
    fileInputRef.current?.click();
  };

  const onImageSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setFeaturedImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFeaturedImagePreview(url);
    } else {
      setFeaturedImagePreview(null);
    }
  };

  const clearSelectedImage = () => {
    setFeaturedImageFile(null);
    setFeaturedImagePreview(editingPost?.featured_image_url ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const savePost = async () => {
    const trimmedTitle = title.trim();
    const trimmedSlug = slug.trim() || toSlug(trimmedTitle);
    const trimmedContent = content.trim();
    const trimmedExcerpt = excerpt.trim();

    if (!trimmedTitle || !trimmedContent) {
      toast({
        title: "Validation error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingPost) {
        await adminBlogApi.update(editingPost.id, {
          title: trimmedTitle,
          slug: trimmedSlug,
          content: trimmedContent,
          excerpt: trimmedExcerpt,
          status,
          featuredImageFile: featuredImageFile ?? undefined,
        });
        toast({ title: "Post updated" });
      } else {
        await adminBlogApi.create({
          title: trimmedTitle,
          slug: trimmedSlug,
          content: trimmedContent,
          excerpt: trimmedExcerpt,
          status,
          featuredImageFile: featuredImageFile ?? undefined,
        });
        toast({ title: "Post created" });
      }
      setIsEditorOpen(false);
      loadPosts();
    } catch (error) {
      toast({
        title: editingPost ? "Update failed" : "Creation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen flex flex-col bg-background"}>
      {!embedded && <DashboardHeader />}
      {!embedded && <DashboardNavBar />}

      <main className={embedded ? "" : "flex-grow py-8"}>
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="w-8 h-8 text-accent" />
              News Management
            </h1>
            <p className="text-muted-foreground">Manage News publishment: create, edit, publish, archive</p>
          </div>

          {/* Top Bar Controls */}
          <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
              {/* Add Article Button */}
              <Button
                onClick={openCreateEditor}
                className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Article
              </Button>

              {/* Search */}
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="🔍 Search Title or Author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter: Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card shadow rounded-xl p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading articles...
                      </TableCell>
                    </TableRow>
                  ) : filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No articles found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="font-semibold">{post.title}</div>
                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {post.excerpt || post.content.slice(0, 120)}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{post.slug}</TableCell>
                        <TableCell>{post.author_name || "Unknown"}</TableCell>
                        <TableCell>{formatDate(post.published_at || post.created_at)}</TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass[post.status]}>{post.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Preview"
                              onClick={() => setPreviewPost(post)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              title="Publish"
                              onClick={() => handleStatusChange(post, "published")}
                              disabled={post.status === "published"}
                            >
                              {post.status === "published" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <CheckCircle2 className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit"
                              onClick={() => openEditEditor(post)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              title="Delete"
                              onClick={() => handleDelete(post)}
                              disabled={isDeleting === post.id}
                            >
                              {isDeleting === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Article" : "Create New Article"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Update your news article" : "Compose a new news article"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Slug *</label>
                <Input value={slug} onChange={(e) => setSlug(toSlug(e.target.value))} placeholder="auto-generated-from-title" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Excerpt</label>
              <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary for lists and meta..." />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Content (HTML) *</label>
              <RichEditor value={content} onChange={setContent} placeholder="Write the full article..." className="font-sans" />
              <p className="text-xs text-muted-foreground mt-1">Use HTML and formatting tools to structure the article.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as BlogPost["status"])}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Featured Image</label>
                <div className="flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageSelected} />
                  <Button type="button" variant="outline" onClick={onPickImage} className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    {featuredImagePreview ? "Change image" : "Upload image"}
                  </Button>
                  {featuredImagePreview && (
                    <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700" onClick={clearSelectedImage}>
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                {featuredImagePreview && (
                  <div className="mt-3">
                    <img src={featuredImagePreview} alt="Featured preview" className="h-32 w-full max-w-sm object-cover rounded-md border" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
            <Button onClick={savePost} disabled={isSaving}>
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : (editingPost ? "Update Article" : "Create Article")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewPost?.title}</DialogTitle>
            <DialogDescription>Preview of the article</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {previewPost?.featured_image_url && (
              <img src={previewPost.featured_image_url} alt="Featured" className="w-full h-56 object-cover rounded-md border" />
            )}
            <div className="text-sm text-muted-foreground">
              <span className="mr-2">Status:</span>
              <Badge className={previewPost ? statusBadgeClass[previewPost.status] : ""}>{previewPost?.status}</Badge>
            </div>
            <div className="prose prose-sm max-w-none prose-invert" dangerouslySetInnerHTML={{ __html: previewPost?.content || "" }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewPost(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!embedded && (
        <footer className="py-4 mt-8">
          <p className="text-center text-gray-500 text-xs">© 2025 CodeKonix | All Rights Reserved</p>
        </footer>
      )}
    </div>
  );
};

export default News;
