import { useEffect, useMemo, useState } from "react";
import { Star, Search, Plus, ChevronRight, Edit, Trash2, Check, X } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import TestimonialModal from "@/components/TestimonialModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminTestimonialsApi } from "@/services/adminTestimonialsApi";
import { useToast } from "@/hooks/use-toast";

interface Testimonial {
  id: number;
  name: string;
  feedback: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}

const Testimonials = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTestimonials = async () => {
    setIsLoading(true);
    try {
      const params = statusFilter === "all" ? {} : { status: statusFilter };
      const data = await adminTestimonialsApi.list(params);
      setTestimonials(data);
    } catch (error) {
      toast({
        title: "Unable to load testimonials",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredTestimonials = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return testimonials.filter((testimonial) =>
      testimonial.name.toLowerCase().includes(query) ||
      testimonial.feedback.toLowerCase().includes(query)
    );
  }, [searchQuery, testimonials]);

  const getStatusBadge = (status: Testimonial["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderRating = (rating: number) => (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className={`w-4 h-4 ${
            index < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
    </div>
  );

  const handleAddTestimonial = () => {
    setSelectedTestimonial(null);
    setIsModalOpen(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setIsModalOpen(true);
  };

  const handleDeleteTestimonial = (testimonial: Testimonial) => {
    setTestimonialToDelete(testimonial);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!testimonialToDelete) return;
    try {
      await adminTestimonialsApi.delete(testimonialToDelete.id);
      toast({ title: "Testimonial deleted" });
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
      loadTestimonials();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTestimonial = async (data: Testimonial) => {
    try {
      if (data.id) {
        await adminTestimonialsApi.update(data.id, data);
        toast({ title: "Testimonial updated" });
      } else {
        await adminTestimonialsApi.create({
          name: data.name,
          feedback: data.feedback,
          rating: data.rating,
          status: data.status,
        });
        toast({ title: "Testimonial added" });
      }
      setIsModalOpen(false);
      setSelectedTestimonial(null);
      loadTestimonials();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (testimonial: Testimonial, action: "approve" | "reject") => {
    try {
      const updated =
        action === "approve"
          ? await adminTestimonialsApi.approve(testimonial.id)
          : await adminTestimonialsApi.reject(testimonial.id);
      toast({ title: action === "approve" ? "Testimonial approved" : "Testimonial rejected" });
      setTestimonials((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <DashboardNavBar />

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Star className="w-8 h-8 text-accent" />
              Testimonials Management
            </h1>
            <p className="text-muted-foreground">Manage customer testimonials and reviews</p>
          </div>

          <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
              <Button onClick={handleAddTestimonial} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Testimonial
              </Button>

              <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="🔍 Search Name or Feedback..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter: Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading testimonials...
                      </TableCell>
                    </TableRow>
                  ) : filteredTestimonials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No testimonials found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTestimonials.map((testimonial) => (
                      <TableRow key={testimonial.id}>
                        <TableCell>
                          <div className="font-semibold">{testimonial.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-md">
                            {testimonial.feedback}
                          </div>
                        </TableCell>
                        <TableCell>{renderRating(testimonial.rating)}</TableCell>
                        <TableCell>{getStatusBadge(testimonial.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              title="Approve"
                              onClick={() => handleStatusChange(testimonial, "approve")}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              title="Reject"
                              onClick={() => handleStatusChange(testimonial, "reject")}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit"
                              onClick={() => handleEditTestimonial(testimonial)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              title="Delete"
                              onClick={() => handleDeleteTestimonial(testimonial)}
                            >
                              <Trash2 className="w-4 h-4" />
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

      <footer className="py-4 mt-8">
        <p className="text-center text-gray-500 text-xs">© 2025 CodeKonix | All Rights Reserved</p>
      </footer>

      <TestimonialModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        testimonial={selectedTestimonial}
        onSave={handleSaveTestimonial}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Testimonials;
