import { redirect } from "next/navigation";

// Sign-up and sign-in are the same email-code flow; kept so old links work.
export default function RegisterPage() {
  redirect("/login");
}
