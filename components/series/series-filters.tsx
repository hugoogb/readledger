"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { statusOptions } from "@/lib/constants";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const statusFilters = [
  { value: "", label: "All" },
  ...statusOptions.map(({ value, label }) => ({ value, label })),
];

const sortOptions = [
  { value: "", label: "Recently Updated" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" },
  { value: "created", label: "Recently Added" },
  { value: "completion", label: "Completion %" },
  { value: "spent", label: "Total Spent" },
];

export function SeriesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "";
  const currentSearch = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "";

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset page when changing filters
    if (key !== "page") {
      params.delete("page");
    }
    router.push(`/dashboard/series?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Search */}
        <Input
          id="series-search"
          icon={<Search className="w-5 h-5" />}
          defaultValue={currentSearch}
          onChange={(e) => updateParams("q", e.target.value)}
          placeholder="Search series..."
          className="flex-1"
        />

        {/* Sort */}
        <Select
          id="series-sort"
          value={currentSort}
          onChange={(e) => updateParams("sort", e.target.value)}
          className="w-full sm:w-48"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={currentStatus === filter.value ? "default" : "secondary"}
            onClick={() => updateParams("status", filter.value)}
            className="whitespace-nowrap h-10"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
