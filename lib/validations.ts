import { z } from "zod";
import { Condition, SeriesStatus } from "./generated/prisma/enums";

export const seriesSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  author: z.string().max(255).optional().or(z.literal("")),
  publisherId: z.string().nullable().optional(),
  status: z.enum(SeriesStatus),
  publishing: z.boolean(),
  totalVolumes: z.number("Total volumes is required and must be a number").int().min(0).nullable(),
  coverImage: z.url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  retailPrice: z.number("Retail price must be a number").min(0).nullable().optional(),
  mangadexId: z.string().nullable().optional(),
});

export const volumeSchema = z.object({
  volumeNumber: z.number().int().min(1),
  title: z.string().max(255).optional().or(z.literal("")),
  owned: z.boolean(),
  read: z.boolean(),
  wishlist: z.boolean().optional(),
  pricePaid: z.number("Price paid is required and must be a number").min(0).nullable().optional(),
  condition: z.enum(Condition).nullable().optional(),
  storeId: z.string().nullable().optional(),
  coverImage: z.url("Must be a valid URL").optional().or(z.literal("")),
  purchaseDate: z.date().nullable().optional(),
  readDate: z.date().nullable().optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const bulkMarkOwnedSchema = z.object({
  totalPrice: z.number("Total price is required and must be a number").min(0),
  storeId: z.string().nullable().optional(),
  condition: z.enum(Condition),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const bulkSetReadSchema = z.object({
  volumeIds: z.array(z.string()).min(1, "Select at least one volume"),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;
export type SignInSchema = z.infer<typeof signInSchema>;
export type SeriesSchema = z.infer<typeof seriesSchema>;
export type VolumeSchema = z.infer<typeof volumeSchema>;
export type BulkMarkOwnedSchema = z.infer<typeof bulkMarkOwnedSchema>;
export type BulkSetReadSchema = z.infer<typeof bulkSetReadSchema>;
