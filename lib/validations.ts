import { z } from "zod";
import { Condition, SeriesStatus } from "./generated/prisma/enums";

/** Upper bound for volumes in one series — keeps volume generation bounded. */
export const MAX_VOLUMES = 1000;

const MANGADEX_COVER_URL = /^https:\/\/uploads\.mangadex\.org\/covers\//;

// Covers render through next/image, which only allows MangaDex covers (see
// next.config.ts). Any other host would crash the page that shows it.
const coverImageSchema = z
  .url("Must be a valid URL")
  .regex(MANGADEX_COVER_URL, "Cover must be a MangaDex cover URL")
  .optional()
  .or(z.literal(""));

export const idSchema = z.uuid("Invalid id");

export const seriesSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  author: z.string().max(255).optional().or(z.literal("")),
  publisherId: idSchema.nullable().optional().or(z.literal("")),
  status: z.enum(SeriesStatus),
  publishing: z.boolean(),
  totalVolumes: z.number("Total volumes is required and must be a number").int().min(0).max(MAX_VOLUMES, `At most ${MAX_VOLUMES} volumes`).nullable(),
  coverImage: coverImageSchema,
  description: z.string().max(2000).optional().or(z.literal("")),
  retailPrice: z.number("Retail price must be a number").min(0).max(100_000).nullable().optional(),
  mangadexId: z.string().max(64).nullable().optional(),
});

export const volumeSchema = z.object({
  volumeNumber: z.number().int().min(1).max(MAX_VOLUMES),
  title: z.string().max(255).optional().or(z.literal("")),
  owned: z.boolean(),
  read: z.boolean(),
  wishlist: z.boolean().optional(),
  pricePaid: z.number("Price paid is required and must be a number").min(0).max(100_000).nullable().optional(),
  condition: z.enum(Condition).nullable().optional(),
  storeId: idSchema.nullable().optional().or(z.literal("")),
  coverImage: coverImageSchema,
  purchaseDate: z.date().nullable().optional(),
  readDate: z.date().nullable().optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const bulkMarkOwnedSchema = z.object({
  totalPrice: z.number("Total price is required and must be a number").min(0).max(1_000_000),
  storeId: idSchema.nullable().optional().or(z.literal("")),
  condition: z.enum(Condition),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const bulkSetReadSchema = z.object({
  volumeIds: z.array(z.string()).min(1, "Select at least one volume"),
});

/** Volume ids for bulk server actions (matches MAX_BULK_SIZE in services). */
export const volumeIdsSchema = z.array(idSchema).min(1, "No volumes selected").max(500);

/** Server-side payload of bulkMarkOwned (the form schema above is client-side). */
export const bulkOwnedPayloadSchema = z.object({
  pricePaid: z.number().min(0).max(100_000).optional(),
  storeId: idSchema.optional(),
  condition: z.enum(Condition),
  purchaseDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

export const seriesVolumesSchema = z
  .array(
    z.object({
      volumeNumber: z.number().int().min(1).max(MAX_VOLUMES),
      title: z.string().max(255).optional(),
      coverImage: z.string().regex(MANGADEX_COVER_URL).nullish(),
    }),
  )
  .max(MAX_VOLUMES);

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or less");

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code (e.g. EUR, USD)");

export const readingGoalSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  target: z
    .number("Goal must be a number")
    .int("Goal must be a whole number")
    .min(1, "Goal must be at least 1")
    .max(1000, "Goal must be 1000 or less"),
});

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

export const displayNameSchema = z
  .string()
  .trim()
  .max(100, "Name must be 100 characters or less");

export type SeriesSchema = z.infer<typeof seriesSchema>;
export type VolumeSchema = z.infer<typeof volumeSchema>;
export type BulkMarkOwnedSchema = z.infer<typeof bulkMarkOwnedSchema>;
export type BulkSetReadSchema = z.infer<typeof bulkSetReadSchema>;
export type ReadingGoalSchema = z.infer<typeof readingGoalSchema>;
