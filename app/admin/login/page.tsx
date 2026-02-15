"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[8px_8px_0px_0px_#1A1A1A] border-2 border-secondary p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-secondary">Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-secondary mb-1"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoComplete="current-password"
              className="w-full"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
