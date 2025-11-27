import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Search, Filter, Eye, RefreshCw, Calendar, ClipboardList } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminInquiriesApi, type AdminInquiry, type InquiryStatus } from "@/services/adminInquiriesApi";
import { claimsApi, type Claim } from "@/services/claimsApi";
import { adminCarSalesApi, type CarPurchaseRequest } from "@/services/adminCarSalesApi";
import { adminCarSellRequestsApi, type CarSellRequest } from "@/services/adminCarSalesApi";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS: Array<{ value: InquiryStatus | "all"; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "unread", label: "Unread" },
  { value: "replied", label: "Replied" },
  { value: "resolved", label: "Resolved" },
];

const STATUS_LABELS: Record<InquiryStatus, string> = {
  unread: "Unread",
  replied: "Replied",
  resolved: "Resolved",
};

const Inquiries = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement | null>(null);

  const deriveSectionFromPath = (pathname: string): "messages" | "purchase-requests" | "sell-requests" | "bookings" => {
    const segments = pathname.split("/").filter(Boolean);
    const idx = segments.indexOf("inquiries");
    const section = idx !== -1 ? segments[idx + 1] : undefined;
    if (section === "purchase-requests") return "purchase-requests";
    if (section === "sell-requests") return "sell-requests";
    if (section === "bookings") return "bookings";
    return "messages";
  };
  const [activeTab, setActiveTab] = useState<"messages" | "purchase-requests" | "sell-requests" | "bookings">(deriveSectionFromPath(location.pathname));
  useEffect(() => {
    const next = deriveSectionFromPath(location.pathname);
    if (next !== activeTab) setActiveTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  const onTabChange = (value: string) => {
    const next = value as "messages" | "purchase-requests" | "sell-requests" | "bookings";
    setActiveTab(next);
    const segments = location.pathname.split("/").filter(Boolean);
    const inquiriesIndex = segments.indexOf("inquiries");
    const base = inquiriesIndex !== -1 ? `/${segments.slice(0, inquiriesIndex + 1).join("/")}` : "/admin/dashboard/inquiries";
    let nextPath = base;
    if (next === "messages") nextPath = `${base}/messages`;
    else if (next === "purchase-requests") nextPath = `${base}/purchase-requests`;
    else if (next === "sell-requests") nextPath = `${base}/sell-requests`;
    else if (next === "bookings") nextPath = `${base}/bookings`;

    if (location.pathname !== nextPath) {
      navigate(nextPath, { replace: false });
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<InquiryStatus | "all">("all");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(null);
  const [modalActionLoading, setModalActionLoading] = useState(false);
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplyExpanded, setIsReplyExpanded] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const resetReplyForm = () => {
    setIsReplyExpanded(false);
    setReplyMessage("");
  };

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const params = filterStatus === "all" ? {} : { status: filterStatus };
      const data = await adminInquiriesApi.list(params);
      setInquiries(data);
    } catch (error) {
      toast({
        title: "Unable to load inquiries",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    if (!isDetailsModalOpen) {
      resetReplyForm();
    }
  }, [isDetailsModalOpen]);

  const filteredInquiries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return inquiries.filter((inquiry) => {
      const subject = inquiry.subject.toLowerCase();
      const message = inquiry.message.toLowerCase();
      return (
        query === "" ||
        inquiry.name.toLowerCase().includes(query) ||
        inquiry.email.toLowerCase().includes(query) ||
        subject.includes(query) ||
        message.includes(query)
      );
    });
  }, [inquiries, searchQuery]);

  const getStatusBadge = (status: InquiryStatus) => {
    const label = STATUS_LABELS[status];
    if (status === "unread") {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
          {label}
        </Badge>
      );
    }

    if (status === "replied") {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
          {label}
        </Badge>
      );
    }

    if (status === "resolved") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
          {label}
        </Badge>
      );
    }

    return null;
  };

  const handleViewDetails = (inquiry: AdminInquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailsModalOpen(true);
    resetReplyForm();
  };

  const handleReplyViaEmail = () => {
    if (!selectedInquiry) return;
    setIsReplyExpanded((prev) => !prev);
  };

  const handleSendReply = async () => {
    if (!selectedInquiry) return;
    if (!replyMessage.trim()) {
      toast({
        title: "Reply required",
        description: "Please enter a reply before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReply(true);
    try {
      const updated = await adminInquiriesApi.reply(selectedInquiry.id, replyMessage.trim());
      setSelectedInquiry(updated);
      setInquiries((prev) => prev.map((inq) => (inq.id === updated.id ? updated : inq)));
      toast({ title: "Reply sent", description: "Email sent to the client." });
      resetReplyForm();
    } catch (error) {
      toast({
        title: "Reply failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleStatusUpdate = async (status: InquiryStatus) => {
    if (!selectedInquiry) return;
    setModalActionLoading(true);
    try {
      const updated = await adminInquiriesApi.updateStatus(selectedInquiry.id, status);
      setSelectedInquiry(updated);
      setInquiries((prev) => prev.map((inq) => (inq.id === updated.id ? updated : inq)));
      toast({ title: "Inquiry updated", description: `Status set to ${STATUS_LABELS[status]}.` });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInquiry) return;
    setModalActionLoading(true);
    try {
      await adminInquiriesApi.delete(selectedInquiry.id);
      toast({ title: "Inquiry deleted" });
      setIsDetailsModalOpen(false);
      setSelectedInquiry(null);
      loadInquiries();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleMarkSpam = async () => {
    if (!selectedInquiry) return;
    setModalActionLoading(true);
    try {
      await adminInquiriesApi.markSpam(selectedInquiry.id);
      toast({ title: "Inquiry marked as spam" });
      setIsDetailsModalOpen(false);
      setSelectedInquiry(null);
      loadInquiries();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleMarkAsRead = () => {
    if (!selectedInquiry) return;
    handleStatusUpdate("replied");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Purchase Requests state
  const [prRequests, setPrRequests] = useState<CarPurchaseRequest[]>([]);
  const [prFilterStatus, setPrFilterStatus] = useState<string>("all");
  const [prSearchQuery, setPrSearchQuery] = useState("");
  const [prLoading, setPrLoading] = useState(true);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [prSelected, setPrSelected] = useState<CarPurchaseRequest | null>(null);
  const [prNotes, setPrNotes] = useState("");
  const [prAssignedStaff, setPrAssignedStaff] = useState("");
  const [prStatus, setPrStatus] = useState<CarPurchaseRequest["status"]>("pending");
  const [prSaving, setPrSaving] = useState(false);
  const PR_STATUS_OPTIONS = [
    "pending",
    "contacted",
    "viewing_scheduled",
    "offer_made",
    "accepted",
    "rejected",
    "completed",
    "cancelled",
  ] as const;
  const loadPurchaseRequests = async () => {
    setPrLoading(true);
    try {
      const params = prFilterStatus === "all" ? {} : { status: prFilterStatus };
      const data = await adminCarSalesApi.listPurchaseRequests(params);
      setPrRequests(data);
    } catch (error) {
      toast({
        title: "Unable to load purchase requests",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setPrLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === "purchase-requests") {
      loadPurchaseRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, prFilterStatus]);
  const filteredPurchaseRequests = useMemo(() => {
    const query = prSearchQuery.toLowerCase();
    return prRequests.filter((request) => {
      const matchesSearch =
        query === "" ||
        request.name.toLowerCase().includes(query) ||
        (request.car_listing_title || "").toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [prRequests, prSearchQuery]);
  const openPrDialog = (request: CarPurchaseRequest) => {
    setPrSelected(request);
    setPrNotes(request.notes || "");
    setPrAssignedStaff(request.assigned_staff ? String(request.assigned_staff) : "");
    setPrStatus(request.status);
    setPrDialogOpen(true);
  };
  const handlePrUpdate = async () => {
    if (!prSelected) return;
    setPrSaving(true);
    try {
      await adminCarSalesApi.updatePurchaseRequest(prSelected.id, {
        status: prStatus,
        notes: prNotes,
        assigned_staff: prAssignedStaff ? Number(prAssignedStaff) : undefined,
      });
      toast({ title: "Request updated" });
      setPrDialogOpen(false);
      loadPurchaseRequests();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setPrSaving(false);
    }
  };

  // Sell Requests state
  const [srRequests, setSrRequests] = useState<CarSellRequest[]>([]);
  const [srFilterStatus, setSrFilterStatus] = useState<string>("all");
  const [srSearchQuery, setSrSearchQuery] = useState("");
  const [srLoading, setSrLoading] = useState(true);
  const [srDialogOpen, setSrDialogOpen] = useState(false);
  const [srSelected, setSrSelected] = useState<CarSellRequest | null>(null);
  const [srNotes, setSrNotes] = useState("");
  const [srAssignedStaff, setSrAssignedStaff] = useState("");
  const [srStatus, setSrStatus] = useState<CarSellRequest["status"]>("pending");
  const [srSaving, setSrSaving] = useState(false);
  const SR_STATUS_OPTIONS = [
    "pending",
    "contacted",
    "evaluating",
    "offer_made",
    "accepted",
    "rejected",
    "completed",
    "cancelled",
  ] as const;
  const loadSellRequests = async () => {
    setSrLoading(true);
    try {
      const params = srFilterStatus === "all" ? {} : { status: srFilterStatus };
      const data = await adminCarSellRequestsApi.list(params);
      setSrRequests(data);
    } catch (error) {
      toast({
        title: "Unable to load sell requests",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSrLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === "sell-requests") {
      loadSellRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, srFilterStatus]);
  const filteredSellRequests = useMemo(() => {
    const query = srSearchQuery.toLowerCase();
    return srRequests.filter((request) => {
      const matchesSearch =
        query === "" ||
        request.name.toLowerCase().includes(query) ||
        (request.email || "").toLowerCase().includes(query) ||
        (request.phone || "").toLowerCase().includes(query) ||
        request.vehicle_make.toLowerCase().includes(query) ||
        request.vehicle_model.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [srRequests, srSearchQuery]);
  const openSrDialog = (request: CarSellRequest) => {
    setSrSelected(request);
    setSrNotes(request.notes || "");
    setSrAssignedStaff(request.assigned_staff ? String(request.assigned_staff) : "");
    setSrStatus(request.status);
    setSrDialogOpen(true);
  };
  const handleSrUpdate = async () => {
    if (!srSelected) return;
    setSrSaving(true);
    try {
      await adminCarSellRequestsApi.update(srSelected.id, {
        status: srStatus,
        notes: srNotes,
        assigned_staff: srAssignedStaff ? Number(srAssignedStaff) : undefined,
      });
      toast({ title: "Request updated" });
      setSrDialogOpen(false);
      loadSellRequests();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSrSaving(false);
    }
  };

  // Bookings state
  const [bkClaims, setBkClaims] = useState<Claim[]>([]);
  const [bkLoading, setBkLoading] = useState(true);
  const [bkFilterStatus, setBkFilterStatus] = useState<string>("all");
  const [bkSearchQuery, setBkSearchQuery] = useState("");
  const [bkSelected, setBkSelected] = useState<Claim | null>(null);
  const [bkDialogOpen, setBkDialogOpen] = useState(false);
  const loadBookings = async () => {
    setBkLoading(true);
    try {
      const params = bkFilterStatus === "all" ? {} : { status: bkFilterStatus };
      const data = await claimsApi.list(params);
      setBkClaims(data);
    } catch (error) {
      toast({
        title: "Unable to load bookings",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setBkLoading(false);
    }
  };
  useEffect(() => {
    if (activeTab === "bookings") {
      loadBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bkFilterStatus]);
  const filteredBookings = useMemo(() => {
    return bkClaims.filter((claim) => {
      const query = bkSearchQuery.toLowerCase();
      const customerName = `${claim.first_name} ${claim.last_name}`.toLowerCase();
      const vehicleName = claim.vehicle_details?.name?.toLowerCase() ?? "";
      const reg = claim.vehicle_registration?.toLowerCase() ?? "";
      return (
        query === "" ||
        customerName.includes(query) ||
        vehicleName.includes(query) ||
        reg.includes(query)
      );
    });
  }, [bkClaims, bkSearchQuery]);
  const openBkDialog = (claim: Claim) => {
    setBkSelected(claim);
    setBkDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <DashboardHeader />

      {/* NavBar */}
      <DashboardNavBar />

      {/* Main Content */}
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-accent" />
              Inquiries
            </h1>
            <p className="text-muted-foreground">Messages, Purchase Requests, Sell Requests, and Bookings in one place</p>
          </div>

          <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
            <TabsList>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Inquiries
              </TabsTrigger>
              <TabsTrigger value="purchase-requests" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Purchase Requests
              </TabsTrigger>
              <TabsTrigger value="sell-requests" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Sell Requests
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-6">
              {/* Top Bar Controls */}
              <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
                  {/* Search */}
                  <div className="flex-1 w-full sm:max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="🔍 Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="w-full sm:w-48">
                    <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as InquiryStatus | "all")}>
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

                  {/* Refresh Button */}
                  <Button onClick={loadInquiries} variant="outline" disabled={isLoading} className="w-full sm:w-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-card shadow rounded-xl p-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Loading inquiries...
                          </TableCell>
                        </TableRow>
                      ) : filteredInquiries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No inquiries found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInquiries.map((inquiry) => (
                          <TableRow key={inquiry.id}>
                            <TableCell>
                              <div className="font-semibold">{inquiry.name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{inquiry.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium max-w-xs truncate" title={inquiry.subject}>
                                {inquiry.subject}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground max-w-md truncate" title={inquiry.message}>
                                {inquiry.message}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(inquiry.created_at)}</TableCell>
                            <TableCell>
                              {getStatusBadge(inquiry.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                title="View Details"
                                onClick={() => handleViewDetails(inquiry)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="purchase-requests" className="space-y-6">
              {/* Top Bar Controls */}
              <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
                  {/* Search */}
                  <div className="flex-1 w-full sm:max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="🔍 Search by customer or vehicle..."
                        value={prSearchQuery}
                        onChange={(event) => setPrSearchQuery(event.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="w-full sm:w-48">
                    <Select value={prFilterStatus} onValueChange={setPrFilterStatus}>
                      <SelectTrigger className="w-full">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter: Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {["pending","contacted","viewing_scheduled","offer_made","accepted","rejected","completed","cancelled"].map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Refresh Button */}
                  <Button variant="outline" onClick={loadPurchaseRequests} disabled={prLoading} className="w-full sm:w-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-card shadow rounded-xl p-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Offer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Loading purchase requests...
                          </TableCell>
                        </TableRow>
                      ) : filteredPurchaseRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No purchase requests found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPurchaseRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <div className="font-semibold">{request.name}</div>
                                <p className="text-xs text-muted-foreground">{request.email}</p>
                                <p className="text-xs text-muted-foreground">{request.phone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">{request.car_listing_title}</div>
                              <p className="text-xs text-muted-foreground">
                                Ref #{request.car_listing}
                              </p>
                            </TableCell>
                            <TableCell>
                              {request.offer_price ? `£${Number(request.offer_price).toLocaleString()}` : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {request.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(request.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                title="View Details"
                                onClick={() => openPrDialog(request)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sell-requests" className="space-y-6">
              {/* Top Bar Controls */}
              <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
                  {/* Search */}
                  <div className="flex-1 w-full sm:max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="🔍 Search by customer, email, phone, or vehicle..."
                        value={srSearchQuery}
                        onChange={(event) => setSrSearchQuery(event.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="w-full sm:w-48">
                    <Select value={srFilterStatus} onValueChange={setSrFilterStatus}>
                      <SelectTrigger className="w-full">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter: Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {SR_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Refresh Button */}
                  <Button variant="outline" onClick={loadSellRequests} disabled={srLoading} className="w-full sm:w-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-card shadow rounded-xl p-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {srLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Loading sell requests...
                          </TableCell>
                        </TableRow>
                      ) : filteredSellRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No sell requests found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSellRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <div className="font-semibold">{request.name}</div>
                                {request.email && (
                                  <p className="text-xs text-muted-foreground">{request.email}</p>
                                )}
                                {request.phone && (
                                  <p className="text-xs text-muted-foreground">{request.phone}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                {request.vehicle_make} {request.vehicle_model}
                              </div>
                            </TableCell>
                            <TableCell>
                              {request.vehicle_year ? request.vehicle_year : "—"}
                            </TableCell>
                            <TableCell>
                              {request.mileage ? `${request.mileage.toLocaleString()} mi` : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {request.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(request.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                title="View Details"
                                onClick={() => openSrDialog(request)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              {/* Top Bar Controls */}
              <div className="bg-white dark:bg-card shadow rounded-xl mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
                  {/* Search */}
                  <div className="flex-1 w-full sm:max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="🔍 Search by customer, vehicle or registration..."
                        value={bkSearchQuery}
                        onChange={(e) => setBkSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="w-full sm:w-48">
                    <Select value={bkFilterStatus} onValueChange={setBkFilterStatus}>
                      <SelectTrigger className="w-full">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter: Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Refresh Button */}
                  <Button variant="outline" onClick={loadBookings} disabled={bkLoading} className="w-full sm:w-auto">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-card shadow rounded-xl p-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Pickup</TableHead>
                        <TableHead>Drop</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bkLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Loading bookings...
                          </TableCell>
                        </TableRow>
                      ) : filteredBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No bookings found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBookings.map((claim) => (
                          <TableRow key={claim.id}>
                            <TableCell>
                              <div className="font-semibold">
                                {claim.first_name} {claim.last_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {claim.vehicle_details?.name || "Unassigned"}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(claim.accident_date)}</TableCell>
                            <TableCell>{claim.pickup_location}</TableCell>
                            <TableCell>{claim.drop_location}</TableCell>
                            <TableCell>
                              {claim.status === "pending" ? (
                                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Pending</Badge>
                              ) : claim.status === "approved" ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Approved</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Cancelled</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                title="View Details"
                                onClick={() => openBkDialog(claim)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 mt-8">
        <p className="text-center text-gray-500 text-xs">
          © 2025 CodeKonix | All Rights Reserved
        </p>
      </footer>

      {/* Inquiry Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              Complete information for inquiry #{selectedInquiry?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="grid gap-4 py-4">
              {/* Name */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
                <p className="font-semibold text-base">{selectedInquiry.name}</p>
              </div>

              {/* Email */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                <p className="text-base">{selectedInquiry.email}</p>
              </div>

              {/* Message */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Message</div>
                <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  {selectedInquiry.message}
                </p>
              </div>

              {/* Vehicle Interest */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Vehicle Interest</div>
                <p className="text-base">{selectedInquiry.vehicle_interest || "Not specified"}</p>
              </div>

              {/* Date */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Date</div>
                <p className="text-base">{formatDate(selectedInquiry.created_at)}</p>
              </div>

              {/* Source */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Source</div>
                <Badge
                  className={
                    selectedInquiry.source === "web"
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200"
                  }
                >
                  {selectedInquiry.source === "web" ? "Web" : "Chatbot"}
                </Badge>
              </div>

              {/* Status Selector */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <Select
                  value={selectedInquiry.status}
                  onValueChange={(value) => handleStatusUpdate(value as InquiryStatus)}
                  disabled={modalActionLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {isReplyExpanded && (
                  <div className="space-y-3 border rounded-xl p-4 bg-muted/40">
                    <div className="text-sm font-semibold">Reply</div>
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder={`Type your reply to ${selectedInquiry.name}...`}
                      rows={5}
                      disabled={isSendingReply}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={resetReplyForm} disabled={isSendingReply}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendReply}
                        disabled={isSendingReply || replyMessage.trim() === ""}
                        className="bg-accent text-white hover:bg-accent/90"
                      >
                        {isSendingReply ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleReplyViaEmail}
                    variant="outline"
                    disabled={modalActionLoading}
                  >
                    Reply via Email
                  </Button>
                  <Button
                    onClick={handleMarkAsRead}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    disabled={modalActionLoading}
                  >
                    Mark as Read
                  </Button>
                  <Button
                    onClick={handleMarkSpam}
                    variant="outline"
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                    disabled={modalActionLoading}
                  >
                    Mark as Spam
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    disabled={modalActionLoading}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Purchase Request Dialog */}
      <Dialog open={prDialogOpen} onOpenChange={setPrDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase request details</DialogTitle>
            <DialogDescription>Review details and update the lead status</DialogDescription>
          </DialogHeader>
          {prSelected && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Customer</p>
                  <p className="font-semibold">{prSelected.name}</p>
                  <p>{prSelected.email}</p>
                  <p>{prSelected.phone}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Vehicle</p>
                  <p className="font-semibold">{prSelected.car_listing_title}</p>
                  <p className="text-xs text-muted-foreground">Ref #{prSelected.car_listing}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Offer</p>
                  <p className="font-semibold">
                    {prSelected.offer_price ? `£${Number(prSelected.offer_price).toLocaleString()}` : "No offer specified"}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Financing</p>
                  <p className="font-semibold">{prSelected.financing_required ? "Required" : "Not required"}</p>
                </div>
              </div>
              {prSelected.trade_in_details && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="text-xs text-muted-foreground uppercase">Trade-in details</p>
                  <p>{prSelected.trade_in_details}</p>
                </div>
              )}
              {prSelected.message && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="text-xs text-muted-foreground uppercase">Message</p>
                  <p>{prSelected.message}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={prStatus} onValueChange={(value) => setPrStatus(value as CarPurchaseRequest["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {["pending","contacted","viewing_scheduled","offer_made","accepted","rejected","completed","cancelled"].map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Assign staff (ID)"
                  value={prAssignedStaff}
                  onChange={(e) => setPrAssignedStaff(e.target.value)}
                />
              </div>
              <Textarea
                placeholder="Internal notes"
                value={prNotes}
                onChange={(event) => setPrNotes(event.target.value)}
                rows={4}
              />
              <Button onClick={handlePrUpdate} disabled={prSaving}>
                {prSaving ? "Saving..." : "Update request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Sell Request Dialog */}
      <Dialog open={srDialogOpen} onOpenChange={setSrDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sell request details</DialogTitle>
            <DialogDescription>Review details and update the request status</DialogDescription>
          </DialogHeader>
          {srSelected && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Customer</p>
                  <p className="font-semibold">{srSelected.name}</p>
                  {srSelected.email && <p>{srSelected.email}</p>}
                  {srSelected.phone && <p>{srSelected.phone}</p>}
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase">Vehicle</p>
                  <p className="font-semibold">
                    {srSelected.vehicle_make} {srSelected.vehicle_model}
                  </p>
                  {srSelected.vehicle_year && (
                    <p className="text-xs text-muted-foreground">Year: {srSelected.vehicle_year}</p>
                  )}
                  {srSelected.mileage && (
                    <p className="text-xs text-muted-foreground">
                      Mileage: {srSelected.mileage.toLocaleString()} mi
                    </p>
                  )}
                </div>
              </div>
              {srSelected.vehicle_image_url && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Vehicle Image</p>
                  <img
                    src={srSelected.vehicle_image_url}
                    alt={`${srSelected.vehicle_make} ${srSelected.vehicle_model}`}
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
              )}
              {srSelected.message && (
                <div className="rounded-lg border border-border p-3 text-sm">
                  <p className="text-xs text-muted-foreground uppercase">Message</p>
                  <p>{srSelected.message}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={srStatus} onValueChange={(value) => setSrStatus(value as CarSellRequest["status"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SR_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Assign staff (ID)"
                  value={srAssignedStaff}
                  onChange={(e) => setSrAssignedStaff(e.target.value)}
                />
              </div>
              <Textarea
                placeholder="Internal notes"
                value={srNotes}
                onChange={(event) => setSrNotes(event.target.value)}
                rows={4}
              />
              <Button onClick={handleSrUpdate} disabled={srSaving}>
                {srSaving ? "Saving..." : "Update request"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Booking Details Dialog (summary) */}
      <Dialog open={bkDialogOpen} onOpenChange={setBkDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Summary of booking information</DialogDescription>
          </DialogHeader>
          {bkSelected && (
            <div className="space-y-5 py-4 text-sm">
              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Customer</p>
                  <p className="text-lg font-semibold">
                    {bkSelected.first_name} {bkSelected.last_name}
                  </p>
                  <p className="text-muted-foreground">{bkSelected.email}</p>
                  <p className="text-muted-foreground">{bkSelected.phone}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Journey</p>
                  <p>Pickup: <span className="text-muted-foreground">{bkSelected.pickup_location}</span></p>
                  <p>Drop: <span className="text-muted-foreground">{bkSelected.drop_location}</span></p>
                  <p>Date: <span className="text-muted-foreground">{formatDate(bkSelected.accident_date)}</span></p>
                </div>
              </section>
              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Vehicle</p>
                  <p className="text-base font-semibold">{bkSelected.vehicle_details?.name || "Unassigned"}</p>
                  <p className="text-muted-foreground text-sm">
                    Reg: {bkSelected.vehicle_registration || "—"}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase text-muted-foreground tracking-wide">Insurance</p>
                  <p className="text-base font-semibold">{bkSelected.insurance_company}</p>
                  <p className="font-mono text-xs">Policy #{bkSelected.policy_number}</p>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inquiries;

