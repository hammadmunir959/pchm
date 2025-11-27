import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Search, Filter, Plus, Send, Edit, Trash2, Eye, Users, FileText, CheckCircle2, AlertCircle, Copy, TestTube, X, Image as ImageIcon } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { adminNewsletterApi, type NewsletterSubscriber, type NewsletterCampaign, type CampaignStatus } from "@/services/adminNewsletterApi";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS: Array<{ value: "all" | "active" | "inactive"; label: string }> = [
  { value: "all", label: "All Subscribers" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
  cancelled: "Cancelled",
};

const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  sending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  sent: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const NewsletterManagement = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  // derive active section from the path
  const deriveSectionFromPath = (pathname: string): "subscribers" | "campaigns" => {
    const segments = pathname.split("/").filter(Boolean);
    const newsletterIndex = segments.indexOf("newsletter");
    const section = newsletterIndex !== -1 ? segments[newsletterIndex + 1] : undefined;
    if (section === "campaigns") return "campaigns";
    return "subscribers";
  };
  const [activeTab, setActiveTab] = useState<"subscribers" | "campaigns">(deriveSectionFromPath(location.pathname));
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCampaignsLoading, setIsCampaignsLoading] = useState(true);
  
  // Campaign filters and actions
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [campaignFilterStatus, setCampaignFilterStatus] = useState<CampaignStatus | "all">("all");
  const [campaignSort, setCampaignSort] = useState<"created_desc" | "created_asc" | "subject_asc" | "subject_desc">("created_desc");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailModalCampaign, setTestEmailModalCampaign] = useState<NewsletterCampaign | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  
  // Selection & bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Add Subscriber modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newSource, setNewSource] = useState("dashboard");
  const [newIsActive, setNewIsActive] = useState(true);
  const [isCreatingSubscriber, setIsCreatingSubscriber] = useState(false);
  // Import Subscribers
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<"csv" | "gsheet">("csv");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSheetUrl, setImportSheetUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<{created: number; failed: number}>({ created: 0, failed: 0 });
  // Export Subscribers
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState<"csv" | "xlsx">("csv");
  // Import helpers
  const parseCsv = (text: string) => {
    const rows: string[][] = [];
    let i = 0, field = "", row: string[] = [], inQuotes = false;
    while (i < text.length) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        } else { field += char; i++; continue; }
      } else {
        if (char === '"') { inQuotes = true; i++; continue; }
        if (char === ',') { row.push(field); field = ""; i++; continue; }
        if (char === '\n' || char === '\r') {
          if (char === '\r' && text[i+1] === '\n') i++;
          row.push(field); rows.push(row); row = []; field = ""; i++; continue;
        }
        field += char; i++; continue;
      }
    }
    row.push(field); rows.push(row);
    return rows;
  };
  const importSubscribersFromRows = async (rows: string[][]) => {
    if (!rows.length) return { created: 0, failed: 0 };
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const idxEmail = headers.indexOf("email");
    const idxName = headers.indexOf("name");
    const idxSource = headers.indexOf("source");
    const idxActive = headers.indexOf("is_active");
    if (idxEmail === -1) throw new Error("Missing 'email' header");
    let created = 0, failed = 0;
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const email = (row[idxEmail] || "").trim();
      if (!email) { failed++; continue; }
      const name = idxName !== -1 ? (row[idxName] || "").trim() : undefined;
      const source = idxSource !== -1 ? (row[idxSource] || "").trim() : undefined;
      let is_active: boolean | undefined = undefined;
      if (idxActive !== -1) {
        const v = String(row[idxActive] || "").trim().toLowerCase();
        if (["true","1","yes","y"].includes(v)) is_active = true;
        else if (["false","0","no","n"].includes(v)) is_active = false;
      }
      try {
        await adminNewsletterApi.createSubscriber({ email, name: name || undefined, source: source || undefined, is_active });
        created++;
      } catch {
        failed++;
      }
    }
    return { created, failed };
  };
  const handleImport = async () => {
    setIsImporting(true);
    try {
      let report = { created: 0, failed: 0 };
      if (importMode === "csv") {
        if (!importFile) throw new Error("Please choose a CSV or Excel file");
        const name = importFile.name.toLowerCase();
        if (name.endsWith(".csv")) {
          const text = await importFile.text();
          const rows = parseCsv(text);
          report = await importSubscribersFromRows(rows);
        } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
          // Parse Excel via SheetJS loaded from CDN
          const XLSX = await import('xlsx');
          const arrayBuffer = await importFile.arrayBuffer();
          const wb = XLSX.read(arrayBuffer, { type: "array" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          report = await importSubscribersFromRows(rows as string[][]);
        } else {
          throw new Error("Unsupported file type. Please upload CSV or Excel (.xlsx/.xls).");
        }
      } else {
        const url = importSheetUrl.trim();
        if (!url) throw new Error("Please enter a Google Sheet URL");
        let fetchUrl = url;
        const re = new RegExp('https://docs\\.google\\.com/spreadsheets/d/([^/]+)');
        const m = re.exec(url);
        if (m && m[1]) {
          fetchUrl = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`;
        }
        const resp = await fetch(fetchUrl);
        if (!resp.ok) throw new Error("Unable to fetch sheet CSV");
        const text = await resp.text();
        const rows = parseCsv(text);
        report = await importSubscribersFromRows(rows);
      }
      setImportReport(report);
      toast({ title: "Import finished", description: `Imported ${report.created}, Failed ${report.failed}` });
      loadSubscribers();
    } catch (e) {
      toast({ title: "Import failed", description: e instanceof Error ? e.message : "Please check your file/url", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Campaign creation/editing
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<NewsletterCampaign | null>(null);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [campaignScheduledAt, setCampaignScheduledAt] = useState("");
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  
  // Campaign preview
  const [previewCampaign, setPreviewCampaign] = useState<NewsletterCampaign | null>(null);
  
  // Pagination - Subscribers
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState(10);
  const [subTotal, setSubTotal] = useState<number | null>(null);
  // Pagination - Campaigns
  const [campPage, setCampPage] = useState(1);
  const [campPageSize, setCampPageSize] = useState(10);
  const [campTotal, setCampTotal] = useState<number | null>(null);


  const loadSubscribers = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page: subPage,
        page_size: subPageSize,
      };
      if (filterStatus !== "all") params.is_active = filterStatus === "active";
      const data = await adminNewsletterApi.listSubscribersPaged(params);
      setSubscribers(data.results);
      setSubTotal(data.count ?? data.results.length);
    } catch (error) {
      toast({
        title: "Unable to load subscribers",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaigns = async () => {
    setIsCampaignsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page: campPage,
        page_size: campPageSize,
      };
      if (campaignFilterStatus !== "all") params.status = campaignFilterStatus;
      const data = await adminNewsletterApi.listCampaignsPaged(params);
      setCampaigns(data.results);
      setCampTotal(data.count ?? data.results.length);
    } catch (error) {
      toast({
        title: "Unable to load campaigns",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCampaignsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, subPage, subPageSize]);

  useEffect(() => {
    loadCampaigns();
  }, [campaignFilterStatus, campPage, campPageSize]);

  // keep tab state in sync when the URL changes externally
  useEffect(() => {
    const next = deriveSectionFromPath(location.pathname);
    if (next !== activeTab) {
      setActiveTab(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // update URL when tab changes
  const onTabChange = (value: string) => {
    const next = value as "subscribers" | "campaigns";
    setActiveTab(next);
    const segments = location.pathname.split("/").filter(Boolean);
    const newsletterIndex = segments.indexOf("newsletter");
    const base = newsletterIndex !== -1 ? `/${segments.slice(0, newsletterIndex + 1).join("/")}` : "/admin/dashboard/newsletter";
    const nextPath = next === "subscribers" ? `${base}/subscribers` : `${base}/campaigns`;
    if (location.pathname !== nextPath) {
      navigate(nextPath, { replace: false });
    }
  };

  // set canonical link per section
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalHref = `${origin}${location.pathname}`;
    // remove existing canonical links we control
    const existing = document.querySelector('link[rel="canonical"]');
    if (existing && existing.parentElement) {
      existing.parentElement.removeChild(existing);
    }
    const link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", canonicalHref);
    document.head.appendChild(link);
    return () => {
      // clean up on unmount or before next change
      if (link.parentElement) {
        link.parentElement.removeChild(link);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);


  const filteredSubscribers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return subscribers.filter((subscriber) =>
      subscriber.email.toLowerCase().includes(query) ||
      subscriber.name?.toLowerCase().includes(query) ||
      subscriber.source?.toLowerCase().includes(query)
    );
  }, [subscribers, searchQuery]);
  const allVisibleSelected = useMemo(
    () => selectedIds.length > 0 && filteredSubscribers.length > 0 && filteredSubscribers.every(s => selectedIds.includes(s.id)),
    [selectedIds, filteredSubscribers]
  );

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubscriberStatusChange = async (subscriber: NewsletterSubscriber, isActive: boolean) => {
    try {
      await adminNewsletterApi.updateSubscriberStatus(subscriber.id, isActive);
      toast({
        title: `Subscriber ${isActive ? "activated" : "deactivated"}`,
      });
      loadSubscribers();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubscriber = async (subscriber: NewsletterSubscriber) => {
    if (!confirm(`Are you sure you want to delete ${subscriber.email}?`)) {
      return;
    }
    try {
      await adminNewsletterApi.deleteSubscriber(subscriber.id);
      toast({ title: "Subscriber deleted" });
      loadSubscribers();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredSubscribers.some(s => s.id === id)));
    } else {
      const visibleIds = filteredSubscribers.map(s => s.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => adminNewsletterApi.updateSubscriberStatus(id, isActive)));
      toast({ title: `Selected subscribers ${isActive ? "activated" : "deactivated"}` });
      setSelectedIds([]);
      loadSubscribers();
    } catch (error) {
      toast({ title: "Bulk update failed", description: error instanceof Error ? error.message : "Please try again later.", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected subscriber(s)?`)) return;
    try {
      await Promise.all(selectedIds.map(id => adminNewsletterApi.deleteSubscriber(id)));
      toast({ title: "Selected subscribers deleted" });
      setSelectedIds([]);
      loadSubscribers();
    } catch (error) {
      toast({ title: "Bulk delete failed", description: error instanceof Error ? error.message : "Please try again later.", variant: "destructive" });
    }
  };

  const handleExportCsv = () => {
    const headers = ["Email","Name","Subscribed At","Source","Status"];
    const rows = filteredSubscribers.map(s => [
      s.email,
      s.name || "",
      s.subscribed_at,
      s.source || "",
      s.is_active ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleExportXlsx = async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = ["Email","Name","Subscribed At","Source","Status"];
      const data = [headers, ...filteredSubscribers.map(s => [
        s.email,
        s.name || "",
        s.subscribed_at,
        s.source || "",
        s.is_active ? "Active" : "Inactive",
      ])];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subscribers_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Excel export failed", description: e instanceof Error ? e.message : "Unable to export", variant: "destructive" });
    }
  };
  const handleExport = async () => {
    if (exportMode === "csv") {
      handleExportCsv();
    } else {
      await handleExportXlsx();
    }
    setIsExportOpen(false);
  };

  const openAddModal = () => {
    setNewEmail("");
    setNewName("");
    setNewSource("dashboard");
    setNewIsActive(true);
    setIsAddModalOpen(true);
  };

  const handleCreateSubscriber = async () => {
    const email = newEmail.trim();
    if (!email) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    setIsCreatingSubscriber(true);
    try {
      await adminNewsletterApi.createSubscriber({ email, name: newName.trim() || undefined, source: newSource || undefined, is_active: newIsActive });
      toast({ title: "Subscriber added" });
      setIsAddModalOpen(false);
      loadSubscribers();
    } catch (error) {
      toast({ title: "Create failed", description: error instanceof Error ? error.message : "Please try again later.", variant: "destructive" });
    } finally {
      setIsCreatingSubscriber(false);
    }
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignSubject("");
    setCampaignContent("");
    setCampaignScheduledAt("");
    setIsCampaignModalOpen(true);
  };

  const handleEditCampaign = (campaign: NewsletterCampaign) => {
    setEditingCampaign(campaign);
    setCampaignSubject(campaign.subject);
    setCampaignContent(campaign.content);
    // Format datetime for datetime-local input (YYYY-MM-DDTHH:MM)
    if (campaign.scheduled_at) {
      const date = new Date(campaign.scheduled_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setCampaignScheduledAt(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setCampaignScheduledAt("");
    }
    setIsCampaignModalOpen(true);
  };

  const handleSaveCampaign = async () => {
    if (!campaignSubject.trim() || !campaignContent.trim()) {
      toast({
        title: "Validation error",
        description: "Subject and content are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingCampaign(true);
    try {
      // Format datetime-local value to ISO string for backend
      let scheduledAt = null;
      if (campaignScheduledAt) {
        const date = new Date(campaignScheduledAt);
        if (!isNaN(date.getTime())) {
          scheduledAt = date.toISOString();
        }
      }

      // Convert plain text to simple HTML email body
      const convertTextToHtml = (text: string) => {
        const paras = text
          .split("\n\n")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
          .join("");
        return `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;font-size:14px;">${paras}</div>`;
      };
      const htmlBody = convertTextToHtml(campaignContent.trim());

      const payload = {
        subject: campaignSubject,
        content: htmlBody,
        scheduled_at: scheduledAt,
        status: scheduledAt ? "scheduled" : "draft" as CampaignStatus,
      };

      if (editingCampaign) {
        await adminNewsletterApi.updateCampaign(editingCampaign.id, payload);
        toast({ title: "Campaign updated" });
      } else {
        await adminNewsletterApi.createCampaign(payload);
        toast({ title: "Campaign created" });
      }
      
      setIsCampaignModalOpen(false);
      loadCampaigns();
    } catch (error) {
      toast({
        title: editingCampaign ? "Update failed" : "Creation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const handleSendCampaign = async (campaign: NewsletterCampaign) => {
    if (campaign.status !== "draft") {
      toast({
        title: "Invalid status",
        description: "Only draft campaigns can be sent.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to send "${campaign.subject}" to all active subscribers?`)) {
      return;
    }

    setIsSendingCampaign(true);
    try {
      await adminNewsletterApi.sendCampaign(campaign.id);
      toast({
        title: "Campaign sent",
        description: "The newsletter has been sent to all active subscribers.",
      });
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (campaign: NewsletterCampaign) => {
    if (!confirm(`Are you sure you want to delete "${campaign.subject}"?`)) {
      return;
    }
    try {
      await adminNewsletterApi.deleteCampaign(campaign.id);
      toast({ title: "Campaign deleted" });
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewCampaign = (campaign: NewsletterCampaign) => {
    setPreviewCampaign(campaign);
  };
  
  const handleDuplicateCampaign = async (campaign: NewsletterCampaign) => {
    try {
      await adminNewsletterApi.createCampaign({
        subject: `${campaign.subject} (Copy)`,
        content: campaign.content,
        scheduled_at: null,
        status: "draft",
      });
      toast({ title: "Campaign duplicated" });
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Duplicate failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  const handleCancelScheduled = async (campaign: NewsletterCampaign) => {
    if (campaign.status !== "scheduled") return;
    if (!confirm(`Cancel scheduled campaign "${campaign.subject}"?`)) return;
    try {
      await adminNewsletterApi.updateCampaign(campaign.id, { status: "cancelled" });
      toast({ title: "Campaign cancelled" });
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Cancel failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  const openSendTestModal = (campaign: NewsletterCampaign) => {
    setTestEmailModalCampaign(campaign);
    setTestEmailAddress("");
  };
  
  const handleSendTest = async () => {
    if (!testEmailModalCampaign || !testEmailAddress.trim()) return;
    setIsSendingTest(true);
    try {
      await adminNewsletterApi.sendCampaignTest(testEmailModalCampaign.id, testEmailAddress.trim());
      toast({ title: "Test email sent", description: `Sent to ${testEmailAddress.trim()}` });
      setTestEmailModalCampaign(null);
      setTestEmailAddress("");
    } catch (error) {
      toast({
        title: "Test send failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };
  
  const filteredCampaigns = useMemo(() => {
    let list = [...campaigns];
    const q = campaignSearchQuery.toLowerCase();
    if (q) {
      list = list.filter(c =>
        c.subject.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q)
      );
    }
    if (campaignFilterStatus !== "all") {
      list = list.filter(c => c.status === campaignFilterStatus);
    }
    switch (campaignSort) {
      case "created_asc":
        list.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "subject_asc":
        list.sort((a,b) => a.subject.localeCompare(b.subject));
        break;
      case "subject_desc":
        list.sort((a,b) => b.subject.localeCompare(a.subject));
        break;
      default:
        list.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [campaigns, campaignSearchQuery, campaignFilterStatus, campaignSort]);

  const activeSubscribersCount = subscribers.filter(s => s.is_active).length;
  const inactiveSubscribersCount = subscribers.filter(s => !s.is_active).length;


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <DashboardNavBar />

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Mail className="w-8 h-8 text-accent" />
              Newsletter Management
            </h1>
            <p className="text-muted-foreground">Manage subscribers and create email campaigns</p>
          </div>

          <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
            <TabsList>
              <TabsTrigger value="subscribers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Subscribers ({subscribers.length})
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Campaigns ({campaigns.length})
              </TabsTrigger>
            </TabsList>

            {/* Subscribers Tab */}
            <TabsContent value="subscribers" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Subscribers</h2>
                  <p className="text-muted-foreground">Manage newsletter subscribers</p>
                </div>
                <Button onClick={openAddModal} className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subscriber
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Subscribers</p>
                      <p className="text-2xl font-bold">{subscribers.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-card border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-green-600">{activeSubscribersCount}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </div>
                <div className="bg-card border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Inactive</p>
                      <p className="text-2xl font-bold text-gray-600">{inactiveSubscribersCount}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-gray-500 opacity-50" />
                  </div>
                </div>
              </div>

              <div className="bg-card shadow rounded-xl p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="🔍 Search by email, name, or source..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-48">
                    <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
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

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => { setIsImportOpen(true); setImportMode("csv"); setImportFile(null); setImportSheetUrl(""); setImportReport({created:0,failed:0}); }}>
                      Import
                    </Button>
                    <Button variant="outline" onClick={() => setIsExportOpen(true)}>Export</Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm text-muted-foreground">Selected: {selectedIds.length}</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatus(true)} disabled={selectedIds.length === 0}>Activate</Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatus(false)} disabled={selectedIds.length === 0}>Deactivate</Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={selectedIds.length === 0}>Delete</Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Subscribed</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : filteredSubscribers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No subscribers found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscribers.map((subscriber) => (
                          <TableRow key={subscriber.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(subscriber.id)}
                                onChange={() => toggleSelectOne(subscriber.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{subscriber.email}</TableCell>
                            <TableCell>{subscriber.name || "—"}</TableCell>
                            <TableCell>{formatDate(subscriber.subscribed_at)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{subscriber.source || "website"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={subscriber.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                                {subscriber.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSubscriberStatusChange(subscriber, !subscriber.is_active)}
                                >
                                  {subscriber.is_active ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteSubscriber(subscriber)}
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
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-muted-foreground">
                    {subTotal !== null ? (
                      <>Showing {(subPage - 1) * subPageSize + Math.min(1, subscribers.length)}–{(subPage - 1) * subPageSize + subscribers.length} of {subTotal}</>
                    ) : (
                      <>Showing {subscribers.length}</>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={String(subPageSize)} onValueChange={(v) => { setSubPageSize(Number(v)); setSubPage(1); }}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="20">20 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setSubPage((p) => Math.max(1, p - 1))} disabled={subPage <= 1}>Prev</Button>
                    <div className="text-sm">Page {subPage}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubPage((p) => p + 1)}
                      disabled={subTotal !== null ? (subPage * subPageSize) >= subTotal : subscribers.length < subPageSize}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Email Campaigns</h2>
                  <p className="text-muted-foreground">Create and manage newsletter campaigns</p>
                </div>
                <Button onClick={handleCreateCampaign} className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>

              <div className="bg-card shadow rounded-xl p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="🔍 Search subject or content..."
                        value={campaignSearchQuery}
                        onChange={(e) => setCampaignSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Select value={campaignFilterStatus} onValueChange={(v) => setCampaignFilterStatus(v as any)}>
                      <SelectTrigger className="w-40">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="sending">Sending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={campaignSort} onValueChange={(v) => setCampaignSort(v as any)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_desc">Newest first</SelectItem>
                        <SelectItem value="created_asc">Oldest first</SelectItem>
                        <SelectItem value="subject_asc">Subject A-Z</SelectItem>
                        <SelectItem value="subject_desc">Subject Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Opened</TableHead>
                        <TableHead>Clicked</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isCampaignsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : filteredCampaigns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No campaigns yet. Create your first campaign to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCampaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.subject}</TableCell>
                            <TableCell>
                              <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                                {CAMPAIGN_STATUS_LABELS[campaign.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-24">{campaign.recipients_count}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-muted rounded">
                                  <div
                                    className="h-2 bg-green-500 rounded"
                                    style={{ width: `${Math.min(100, campaign.recipients_count ? (campaign.opened_count / Math.max(1, campaign.recipients_count)) * 100 : 0)}%` }}
                                  />
                                </div>
                                <span className="text-xs">{campaign.opened_count}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-muted rounded">
                                  <div
                                    className="h-2 bg-blue-500 rounded"
                                    style={{ width: `${Math.min(100, campaign.recipients_count ? (campaign.clicked_count / Math.max(1, campaign.recipients_count)) * 100 : 0)}%` }}
                                  />
                                </div>
                                <span className="text-xs">{campaign.clicked_count}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(campaign.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handlePreviewCampaign(campaign)}
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openSendTestModal(campaign)}
                                  title="Send Test"
                                >
                                  <TestTube className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDuplicateCampaign(campaign)}
                                  title="Duplicate"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                {campaign.status === "draft" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEditCampaign(campaign)}
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-green-600 hover:text-green-700"
                                      onClick={() => handleSendCampaign(campaign)}
                                      title="Send"
                                      disabled={isSendingCampaign}
                                    >
                                      {isSendingCampaign ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Send className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                                {campaign.status === "scheduled" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                    onClick={() => handleCancelScheduled(campaign)}
                                    title="Cancel Scheduled"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteCampaign(campaign)}
                                  title="Delete"
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
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-muted-foreground">
                    {campTotal !== null ? (
                      <>Showing {(campPage - 1) * campPageSize + Math.min(1, campaigns.length)}–{(campPage - 1) * campPageSize + campaigns.length} of {campTotal}</>
                    ) : (
                      <>Showing {campaigns.length}</>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={String(campPageSize)} onValueChange={(v) => { setCampPageSize(Number(v)); setCampPage(1); }}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="20">20 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setCampPage((p) => Math.max(1, p - 1))} disabled={campPage <= 1}>Prev</Button>
                    <div className="text-sm">Page {campPage}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCampPage((p) => p + 1)}
                      disabled={campTotal !== null ? (campPage * campPageSize) >= campTotal : campaigns.length < campPageSize}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </main>

      {/* Campaign Creation/Edit Modal */}
      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? "Update your newsletter campaign" : "Create a new newsletter campaign to send to subscribers"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject *</label>
              <Input
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Content *</label>
              <Textarea
                value={campaignContent}
                onChange={(e) => setCampaignContent(e.target.value)}
                placeholder="Type your email content in plain text. We'll format it as HTML."
                className="min-h-40"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can include {`{{email}}`} to personalize with subscriber email.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Schedule (Optional)</label>
              <Input
                type="datetime-local"
                value={campaignScheduledAt}
                onChange={(e) => setCampaignScheduledAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to save as draft. Set a date/time to schedule for later.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCampaign} disabled={isSavingCampaign}>
              {isSavingCampaign ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingCampaign ? "Update Campaign" : "Create Campaign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Add Subscriber Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subscriber</DialogTitle>
            <DialogDescription>Manually add a new newsletter subscriber.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Email *</label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Source</label>
              <Input value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="dashboard / website" />
            </div>
            <div className="flex items-center gap-2">
              <input id="add-active" type="checkbox" checked={newIsActive} onChange={(e) => setNewIsActive(e.target.checked)} />
              <label htmlFor="add-active" className="text-sm">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSubscriber} disabled={isCreatingSubscriber}>
              {isCreatingSubscriber ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Add Subscriber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Subscribers Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Import Subscribers</DialogTitle>
            <DialogDescription>Import from a CSV file or a public Google Sheet.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={importMode === "csv" ? "default" : "outline"} size="sm" onClick={() => setImportMode("csv")}>CSV File</Button>
              <Button variant={importMode === "gsheet" ? "default" : "outline"} size="sm" onClick={() => setImportMode("gsheet")}>Google Sheet (CSV export)</Button>
            </div>
            {importMode === "csv" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload CSV or Excel (.xlsx/.xls)</label>
                <input
                  type="file"
                  accept=".csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Expected headers: email, name (optional), source (optional), is_active (true/false, optional)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Public Google Sheet URL</label>
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/..../edit#gid=0"
                  value={importSheetUrl}
                  onChange={(e) => setImportSheetUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Share the sheet as Anyone with the link → Viewer. We'll fetch it as CSV.
                </p>
              </div>
            )}
            {(importReport.created > 0 || importReport.failed > 0) && (
              <div className="rounded-md border p-2 text-sm">
                <div>Imported: {importReport.created}</div>
                <div>Failed: {importReport.failed}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>Close</Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</> : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Subscribers Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Subscribers</DialogTitle>
            <DialogDescription>Choose your preferred export format.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={exportMode === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportMode("csv")}
              >
                CSV
              </Button>
              <Button
                variant={exportMode === "xlsx" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportMode("xlsx")}
              >
                Excel (.xlsx)
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The export will include email, name, subscribed at, source, and status.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
            <Button onClick={handleExport}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Preview Modal */}
      <Dialog open={!!previewCampaign} onOpenChange={() => setPreviewCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewCampaign?.subject}</DialogTitle>
            <DialogDescription>
              Preview of newsletter campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="mb-4 flex gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge className={previewCampaign ? CAMPAIGN_STATUS_COLORS[previewCampaign.status] : ""}>
                    {previewCampaign ? CAMPAIGN_STATUS_LABELS[previewCampaign.status] : ""}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Recipients:</span> {previewCampaign?.recipients_count || 0}
                </div>
                <div>
                  <span className="font-medium">Opened:</span> {previewCampaign?.opened_count || 0}
                </div>
                <div>
                  <span className="font-medium">Clicked:</span> {previewCampaign?.clicked_count || 0}
                </div>
              </div>
              <div 
                className="prose prose-sm max-w-none prose-invert"
                dangerouslySetInnerHTML={{ __html: previewCampaign?.content || "" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewCampaign(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Test Email Modal */}
      <Dialog open={!!testEmailModalCampaign} onOpenChange={() => setTestEmailModalCampaign(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test of "{testEmailModalCampaign?.subject}" to your email to preview formatting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              disabled={isSendingTest}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailModalCampaign(null)} disabled={isSendingTest}>Cancel</Button>
            <Button onClick={handleSendTest} disabled={isSendingTest || !testEmailAddress.trim()}>
              {isSendingTest ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="py-4 mt-8">
        <p className="text-center text-muted-foreground text-xs">© 2025 CodeKonix | All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default NewsletterManagement;

