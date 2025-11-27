import { useEffect, useMemo, useState } from "react";
import { Star, Search, Archive, Trash2, CheckCircle2, XCircle, Filter } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { adminTestimonialsApi } from "@/services/adminTestimonialsApi";
import { useToast } from "@/hooks/use-toast";
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

interface Testimonial {
  id: number;
  name: string;
  feedback: string;
  rating: number;
  service_type?: "car_hire" | "car_rental" | "claims_management" | "car_purchase_sale" | null;
  status: "pending" | "approved" | "rejected" | "archived";
  created_at?: string;
}

const getServiceTypeLabel = (serviceType?: string | null): string => {
  const serviceLabels: Record<string, string> = {
    car_hire: "Car Hire",
    car_rental: "Car Rental",
    claims_management: "Claims Management",
    car_purchase_sale: "Car Purchase/ Sale",
  };
  return serviceType ? serviceLabels[serviceType] || serviceType : "";
};

interface TestimonialsManagementProps {
  embedded?: boolean;
}

const TestimonialsManagement = ({ embedded = false }: TestimonialsManagementProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
    return testimonials.filter(
      (testimonial) =>
        testimonial.name.toLowerCase().includes(query) ||
        testimonial.feedback.toLowerCase().includes(query)
    );
  }, [searchQuery, testimonials]);

  const getStatusBadge = (status: Testimonial["status"]) => {
    const badgeClasses: Record<Testimonial["status"], string> = {
      pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200",
      approved: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
      rejected: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
      archived: "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200",
    };
    const labels: Record<Testimonial["status"], string> = {
      pending: "Pending",
      approved: "Published",
      rejected: "Rejected",
      archived: "Archived",
    };
    return (
      <Badge className={badgeClasses[status]}>
        {labels[status]}
      </Badge>
    );
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

  const handlePublish = async (testimonial: Testimonial) => {
    setActionLoading(testimonial.id);
    try {
      await adminTestimonialsApi.publish(testimonial.id);
      toast({ title: "Testimonial published", description: "It will now appear on the website." });
      loadTestimonials();
    } catch (error) {
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (testimonial: Testimonial) => {
    setActionLoading(testimonial.id);
    try {
      await adminTestimonialsApi.archive(testimonial.id);
      toast({ title: "Testimonial archived", description: "It has been moved to archived." });
      loadTestimonials();
    } catch (error) {
      toast({
        title: "Archive failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (testimonial: Testimonial) => {
    setTestimonialToDelete(testimonial);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!testimonialToDelete) return;
    setActionLoading(testimonialToDelete.id);
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
    } finally {
      setActionLoading(null);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Top Bar Controls */}
      <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
          {/* Search */}
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="🔍 Search by name or feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter: Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
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
                <TableHead>Service</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading testimonials...
                  </TableCell>
                </TableRow>
              ) : filteredTestimonials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                      <div className="text-sm text-muted-foreground max-w-md line-clamp-2">
                        {testimonial.feedback}
                      </div>
                    </TableCell>
                    <TableCell>
                      {testimonial.service_type ? (
                        <Badge variant="outline" className="text-xs">
                          {getServiceTypeLabel(testimonial.service_type)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{renderRating(testimonial.rating)}</TableCell>
                    <TableCell>{getStatusBadge(testimonial.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {testimonial.status !== "approved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                            title="Publish"
                            onClick={() => handlePublish(testimonial)}
                            disabled={actionLoading === testimonial.id}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {testimonial.status !== "archived" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-gray-700"
                            title="Archive"
                            onClick={() => handleArchive(testimonial)}
                            disabled={actionLoading === testimonial.id}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          title="Delete"
                          onClick={() => handleDeleteClick(testimonial)}
                          disabled={actionLoading === testimonial.id}
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

  if (embedded) {
    return content;
  }

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
            <p className="text-muted-foreground">Manage testimonials displayed on the website</p>
          </div>
          {content}
        </div>
      </main>
      <footer className="py-4 mt-8">
        <p className="text-center text-gray-500 text-xs">© {new Date().getFullYear()} CodeKonix | All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default TestimonialsManagement;

