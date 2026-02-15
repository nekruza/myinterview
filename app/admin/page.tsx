"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type WaitlistEntry = {
  id: string;
  email: string;
  created_at: string;
};

type ApplicationStatus = "new" | "reviewed" | "rejected";

type Application = {
  id: string;
  name: string;
  email: string;
  role: string;
  linkedin_url: string;
  cover_letter: string;
  created_at: string;
  status: ApplicationStatus;
};

type Tab = "waitlist" | "applications";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getWeekAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

const STATUS_CYCLE: Record<ApplicationStatus, ApplicationStatus> = {
  new: "reviewed",
  reviewed: "rejected",
  rejected: "new",
};

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("waitlist");
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const fetchWaitlist = useCallback(async () => {
    setLoadingWaitlist(true);
    try {
      const res = await fetch("/api/admin/waitlist");
      if (res.ok) {
        const json = await res.json() as { data: WaitlistEntry[] };
        setWaitlist(json.data ?? []);
      }
    } finally {
      setLoadingWaitlist(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoadingApplications(true);
    try {
      const res = await fetch("/api/admin/applications");
      if (res.ok) {
        const json = await res.json() as { data: Application[] };
        setApplications(json.data ?? []);
      }
    } finally {
      setLoadingApplications(false);
    }
  }, []);

  useEffect(() => {
    void fetchWaitlist();
    void fetchApplications();
  }, [fetchWaitlist, fetchApplications]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function deleteWaitlistEntry(id: string) {
    if (!window.confirm("Delete this waitlist entry?")) return;
    const res = await fetch(`/api/admin/waitlist/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWaitlist((prev) => prev.filter((e) => e.id !== id));
    }
  }

  async function deleteApplication(id: string) {
    if (!window.confirm("Delete this application?")) return;
    const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
    if (res.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (expandedApp === id) setExpandedApp(null);
    }
  }

  async function cycleStatus(app: Application) {
    const nextStatus = STATUS_CYCLE[app.status ?? "new"];
    const res = await fetch(`/api/admin/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: nextStatus } : a))
      );
    }
  }

  const weekAgo = getWeekAgo();
  const appsThisWeek = applications.filter(
    (a) => new Date(a.created_at) >= weekAgo
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-secondary shadow-[0_4px_0_0_#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleLogout()}
            className="border-white text-white hover:bg-white hover:text-secondary"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[4px_4px_0px_0px_#E5E7EB] p-6">
            <p className="text-sm text-gray-500 font-medium">Total Waitlist</p>
            <p className="text-3xl font-bold text-secondary mt-1">
              {loadingWaitlist ? "—" : waitlist.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[4px_4px_0px_0px_#E5E7EB] p-6">
            <p className="text-sm text-gray-500 font-medium">Total Applications</p>
            <p className="text-3xl font-bold text-secondary mt-1">
              {loadingApplications ? "—" : applications.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[4px_4px_0px_0px_#E5E7EB] p-6">
            <p className="text-sm text-gray-500 font-medium">Applications This Week</p>
            <p className="text-3xl font-bold text-secondary mt-1">
              {loadingApplications ? "—" : appsThisWeek}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab("waitlist")}
            className={cn(
              "px-5 py-2.5 font-semibold text-sm transition-colors -mb-0.5 border-b-2",
              activeTab === "waitlist"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Waitlist
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={cn(
              "px-5 py-2.5 font-semibold text-sm transition-colors -mb-0.5 border-b-2",
              activeTab === "applications"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Applications
          </button>
        </div>

        {/* Waitlist Tab */}
        {activeTab === "waitlist" && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[4px_4px_0px_0px_#E5E7EB] overflow-hidden">
            {loadingWaitlist ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : waitlist.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No waitlist entries yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Email</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Joined</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-700">{entry.email}</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(entry.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => void deleteWaitlistEntry(entry.id)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[4px_4px_0px_0px_#E5E7EB] overflow-hidden">
            {loadingApplications ? (
              <div className="p-12 text-center text-gray-400">Loading...</div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No applications yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Name</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Email</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Role</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Date</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <Fragment key={app.id}>
                        <tr
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedApp(expandedApp === app.id ? null : app.id)
                          }
                        >
                          <td className="px-6 py-4 font-medium text-gray-800">{app.name}</td>
                          <td className="px-6 py-4 text-gray-600">{app.email}</td>
                          <td className="px-6 py-4 text-gray-600">{app.role}</td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(app.created_at)}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void cycleStatus(app);
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-all hover:opacity-80",
                                STATUS_BADGE[app.status ?? "new"]
                              )}
                              title="Click to cycle status"
                            >
                              {app.status ?? "new"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void deleteApplication(app.id);
                              }}
                              className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                        {expandedApp === app.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-6 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h3 className="font-semibold text-secondary mb-3">
                                    Applicant Details
                                  </h3>
                                  <dl className="space-y-2 text-sm">
                                    <div className="flex gap-2">
                                      <dt className="font-medium text-gray-500 w-24 shrink-0">Name:</dt>
                                      <dd className="text-gray-700">{app.name}</dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="font-medium text-gray-500 w-24 shrink-0">Email:</dt>
                                      <dd className="text-gray-700">
                                        <a
                                          href={`mailto:${app.email}`}
                                          className="underline text-blue-600"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {app.email}
                                        </a>
                                      </dd>
                                    </div>
                                    <div className="flex gap-2">
                                      <dt className="font-medium text-gray-500 w-24 shrink-0">Role:</dt>
                                      <dd className="text-gray-700">{app.role}</dd>
                                    </div>
                                    {app.linkedin_url && (
                                      <div className="flex gap-2">
                                        <dt className="font-medium text-gray-500 w-24 shrink-0">LinkedIn:</dt>
                                        <dd>
                                          <a
                                            href={app.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline text-blue-600 break-all"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {app.linkedin_url}
                                          </a>
                                        </dd>
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <dt className="font-medium text-gray-500 w-24 shrink-0">Applied:</dt>
                                      <dd className="text-gray-700">{formatDate(app.created_at)}</dd>
                                    </div>
                                  </dl>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-secondary mb-3">Cover Letter</h3>
                                  {app.cover_letter ? (
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg p-3">
                                      {app.cover_letter}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">No cover letter provided.</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
