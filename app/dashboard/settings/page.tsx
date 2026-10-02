import { getPublishers } from "@/actions/publishers";
import { getStores } from "@/actions/stores";
import { PublisherList } from "@/components/settings/publisher-list";
import { StoreList } from "@/components/settings/store-list";
import { CurrencyForm } from "@/components/account/currency-form";
import { DisplayNameForm } from "@/components/account/display-name-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { Building2, Store, UserRound } from "lucide-react";

export default async function SettingsPage() {
  const [user, publishers, stores] = await Promise.all([
    requireUser(),
    getPublishers(),
    getStores(),
  ]);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-foreground-muted mt-1">
          Manage your account, publishers and stores
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserRound className="w-5 h-5" />
              Account
            </CardTitle>
            <CardDescription>Your name and how prices are shown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DisplayNameForm initialName={user.name} />
            <CurrencyForm initialCurrency={user.currency} />
          </CardContent>
        </Card>

        <Card>
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

        <Card>
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
