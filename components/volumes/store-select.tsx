"use client";

import { createStore } from "@/actions/stores";
import { CreatableSelect } from "@/components/ui/creatable-select";
import { unwrap } from "@/lib/unwrap";
import { errorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type StoreSelectProps = {
  stores: { id: string; name: string }[];
  value: string;
  onChange: (storeId: string) => void;
  error?: boolean;
};

export function StoreSelect({ stores, value, onChange, error }: StoreSelectProps) {
  const router = useRouter();

  return (
    <CreatableSelect
      id="storeId"
      options={stores.map((s) => ({ value: s.id, label: s.name }))}
      value={value}
      onChange={onChange}
      onCreate={async (name) => {
        try {
          const store = unwrap(await createStore(name));
          toast.success(`Store "${store.name}" created`);
          router.refresh();
          return store;
        } catch (err) {
          toast.error(errorMessage(err, "Failed to create store"));
          throw err;
        }
      }}
      placeholder="No store"
      createLabel="Add new store..."
      error={error}
    />
  );
}
