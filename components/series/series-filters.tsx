"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const statusFilters = [
  { value: "", label: "All" },
  { value: "READING", label: "Reading" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "DROPPED", label: "Dropped" },
  { value: "PLAN_TO_READ", label: "Plan to Read" },
];

export function SeriesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "";
  const currentSearch = searchParams.get("q") || "";

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/series?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <Input
        icon={<Search className="w-5 h-5" />}
        defaultValue={currentSearch}
        onChange={(e) => updateParams("q", e.target.value)}
        placeholder="Search series..."
        className="flex-1"
      />

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={currentStatus === filter.value ? "default" : "secondary"}
            onClick={() => updateParams("status", filter.value)}
            className="whitespace-nowrap h-12"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
