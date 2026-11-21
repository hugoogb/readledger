import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageMessage } from "@/components/ui/page-message";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <PageMessage
        eyebrow="404"
        title="This page isn't on the shelf"
        body="The page you're looking for doesn't exist or has been moved."
      >
        <Link href="/" className={buttonVariants()}>
          Go home
        </Link>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Dashboard
        </Link>
      </PageMessage>
    </div>
  );
}
