import { getPublishers } from "@/actions/publishers";
import { getStores } from "@/actions/stores";
import { PublisherList } from "@/components/settings/publisher-list";
import { StoreList } from "@/components/settings/store-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Store } from "lucide-react";

export default async function SettingsPage() {
  const [publishers, stores] = await Promise.all([
    getPublishers(),
    getStores(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-foreground-muted mt-1">
          Manage your publishers and stores
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <Card className="animate-fade-in stagger-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Publishers
            </CardTitle>
            <CardDescription>
              Manage publishers for your series
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublisherList publishers={publishers} />
          </CardContent>
        </Card>

        <Card className="animate-fade-in stagger-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="w-5 h-5" />
              Stores
            </CardTitle>
            <CardDescription>
              Manage stores where you buy volumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StoreList stores={stores} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
