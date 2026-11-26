"use client";

import { Avatar } from "@avatar-generator/react";
import { portraits } from "@avatar-generator/style-portraits";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LIGHT = { colors: ["#f6f2e9"], ink: "#1f4a3a" };
const DARK = { colors: ["#17140f"], ink: "#6fae8f" };

export type AvatarUser = { id: string; avatarUrl: string | null };

type UserAvatarProps = {
  user: AvatarUser;
  size: number;
  className?: string;
};

export function UserAvatar({ user, size, className }: UserAvatarProps) {
  const classes = cn("shrink-0 rounded-full ring-1 ring-border", className);

  if (user.avatarUrl) {
    return (
      <Image
        width={size}
        height={size}
        src={user.avatarUrl}
        alt=""
        className={cn(classes, "object-cover")}
      />
    );
  }

  return (
    <>
      <Avatar
        style={portraits}
        options={{ seed: user.id, size, ...LIGHT }}
        alt=""
        className={cn(classes, "dark:hidden")}
      />
      <Avatar
        style={portraits}
        options={{ seed: user.id, size, ...DARK }}
        alt=""
        className={cn(classes, "hidden dark:block")}
      />
    </>
  );
}
