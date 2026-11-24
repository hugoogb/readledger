import { getPublishers } from "@/actions/publishers";
import { getStores } from "@/actions/stores";
import { PublisherList, StoreList } from "@/components/settings/name-list";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const [user, publishers, stores] = await Promise.all([
    requireUser(),
    getPublishers(),
    getStores(),
  ]);

  return (
    <div className="p-4 lg:p-8">
      <Link
        href="/dashboard/profile"
        className="mb-3 inline-flex items-center gap-2 py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Profile
      </Link>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium">Settings</h1>
        <p className="text-foreground-muted mt-1">
          Manage your account, publishers and stores
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your name and how prices are shown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DisplayNameForm initialName={user.name} />
            <CurrencyForm initialCurrency={user.currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publishers</CardTitle>
            <CardDescription>
              Manage publishers for your books
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublisherList publishers={publishers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stores</CardTitle>
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
