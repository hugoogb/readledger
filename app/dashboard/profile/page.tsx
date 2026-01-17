import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/actions/auth";
import { User, Mail, Calendar, LogOut } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-foreground-muted mt-1">Manage your account</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Card */}
        <Card className="animate-fade-in stagger-1">
          <CardHeader className="flex flex-row items-center gap-4">
            {user.avatarUrl ? (
              <Image
                width={80}
                height={80}
                src={user.avatarUrl}
                alt={user.name || "User avatar"}
                className="rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <User className="w-10 h-10 text-accent" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl">
                {user.name || "Anonymous"}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-background-tertiary border border-border/50">
              <Mail className="w-5 h-5 text-foreground-muted" />
              <div>
                <p className="text-xs text-foreground-muted uppercase font-bold tracking-wider">
                  Email
                </p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-background-tertiary border border-border/50">
              <Calendar className="w-5 h-5 text-foreground-muted" />
              <div>
                <p className="text-xs text-foreground-muted uppercase font-bold tracking-wider">
                  Member since
                </p>
                <p className="font-medium">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "long",
                  }).format(user.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="animate-fade-in stagger-2">
          <CardHeader>
            <CardTitle className="text-lg">Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={signOut}>
              <Button
                variant="ghost"
                type="submit"
                className="text-error hover:bg-error/10 hover:text-error gap-2 -ml-2"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
