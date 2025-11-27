import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Building2,
  Bell,
  User,
  Database,
  Save,
  Upload,
  ChevronDown,
  UserPlus,
  Users,
  Download,
  Play
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardNavBar from "@/components/DashboardNavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Settings = () => {
  // Company Info State
  const [companyInfo, setCompanyInfo] = useState({
    name: "Prestige Car Hire Management LTD",
    email: "info@prestigecarhiremanagement.co.uk",
    phone: "+44 345 565 1332",
    logo: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    dashboardAlerts: true,
    smsAlerts: false,
  });

  // Account Settings State
  const [accountSettings, setAccountSettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Backup Settings State
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: "daily",
  });

  const handleCompanyInfoChange = (field: string, value: string) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setCompanyInfo((prev) => ({
          ...prev,
          logo: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationChange = (field: string, checked: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: checked }));
  };

  const handleAccountChange = (field: string, value: string) => {
    setAccountSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = () => {
    console.log("Updating password:", accountSettings);
    // Dummy handler - would validate and update password
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (accountSettings.newPassword.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }
    alert("Password updated successfully!");
    // Reset password fields
    setAccountSettings({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleAddUser = () => {
    console.log("Add new user");
    // Dummy handler - would open modal or navigate to add user page
    alert("Add User functionality - would open user creation form");
  };

  const handleListUsers = () => {
    console.log("List users");
    // Dummy handler - would navigate to users list page
    alert("List Users functionality - would navigate to users management page");
  };

  const handleBackupChange = (field: string, value: string) => {
    setBackupSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleRunBackup = () => {
    console.log("Running backup now...");
    // Dummy handler - would trigger backup process
    alert("Backup process started. This may take a few minutes.");
  };

  const handleDownloadBackup = () => {
    console.log("Downloading backup...");
    // Dummy handler - would download latest backup
    alert("Downloading latest backup file...");
  };

  const handleSaveAllChanges = () => {
    console.log("Saving all changes:", {
      companyInfo,
      notificationSettings,
      accountSettings,
      backupSettings,
    });
    // Dummy handler - would save all settings to backend
    alert("All changes saved successfully!");
  };

  const handleSave = (section: string) => {
    console.log(`Saving ${section} settings:`, {
      companyInfo,
      notificationSettings,
      accountSettings,
      backupSettings,
    });
    // Dummy handler - would save to backend
    alert(`${section} settings saved successfully!`);
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
              <SettingsIcon className="w-8 h-8 text-accent" />
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your admin configuration and preferences
            </p>
          </div>

          {/* Company Info Section */}
          <div className="bg-white dark:bg-card shadow rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-semibold">Company Info</h2>
              </div>
              <Button
                onClick={() => handleSave("Company Info")}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            <Separator className="mb-6" />
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={companyInfo.name}
                  onChange={(e) => handleCompanyInfoChange("name", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company-email">Email *</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => handleCompanyInfoChange("email", e.target.value)}
                  placeholder="company@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company-phone">Phone *</Label>
                <Input
                  id="company-phone"
                  value={companyInfo.phone}
                  onChange={(e) => handleCompanyInfoChange("phone", e.target.value)}
                  placeholder="+44 345 565 1332"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company-logo">Logo Upload</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="company-logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="company-logo"
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Choose logo or drag and drop</span>
                    </Label>
                  </div>
                  {logoPreview && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: PNG or JPG, max 2MB, 200x200px or larger
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings Section */}
          <div className="bg-white dark:bg-card shadow rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-semibold">Notification Settings</h2>
              </div>
              <Button
                onClick={() => handleSave("Notification Settings")}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            <Separator className="mb-6" />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("emailNotifications", checked as boolean)
                  }
                />
                <Label
                  htmlFor="email-notifications"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email Notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dashboard-alerts"
                  checked={notificationSettings.dashboardAlerts}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("dashboardAlerts", checked as boolean)
                  }
                />
                <Label
                  htmlFor="dashboard-alerts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Dashboard Alerts
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms-alerts"
                  checked={notificationSettings.smsAlerts}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("smsAlerts", checked as boolean)
                  }
                />
                <Label
                  htmlFor="sms-alerts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  SMS Alerts
                </Label>
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-white dark:bg-card shadow rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-semibold">Account Settings</h2>
              </div>
            </div>
            <Separator className="mb-6" />
            <div className="grid gap-6">
              {/* Change Password Section */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={accountSettings.currentPassword}
                      onChange={(e) => handleAccountChange("currentPassword", e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={accountSettings.newPassword}
                      onChange={(e) => handleAccountChange("newPassword", e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={accountSettings.confirmPassword}
                      onChange={(e) => handleAccountChange("confirmPassword", e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    onClick={handleUpdatePassword}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Update Password
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Manage Users Section */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Manage Users</h3>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto">
                        Manage Users
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={handleAddUser}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleListUsers}>
                        <Users className="w-4 h-4 mr-2" />
                        List Users
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Data Section */}
          <div className="bg-white dark:bg-card shadow rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6 text-accent" />
                <h2 className="text-2xl font-semibold">Backup & Data</h2>
              </div>
            </div>
            <Separator className="mb-6" />
            <div className="grid gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleRunBackup}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Backup Now
                </Button>
                <Button
                  onClick={handleDownloadBackup}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auto-backup">Auto Backup</Label>
                <Select
                  value={backupSettings.autoBackup}
                  onValueChange={(value) => handleBackupChange("autoBackup", value)}
                >
                  <SelectTrigger id="auto-backup" className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Save All Changes Button */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleSaveAllChanges}
              className="bg-blue-500 hover:bg-blue-600 px-8 py-6 text-lg"
              size="lg"
            >
              <Save className="w-5 h-5 mr-2" />
              Save All Changes
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 mt-8">
        <p className="text-center text-gray-500 text-xs">
          © 2025 CodeKonix | All Rights Reserved
        </p>
      </footer>
    </div>
  );
};

export default Settings;

