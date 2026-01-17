import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabaseUser = await getUser();

  if (!supabaseUser) {
    return null;
  }

  // Find or create user in our database
  let user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.name || null,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
      },
    });
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
