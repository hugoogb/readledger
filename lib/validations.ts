import { z } from "zod";
import {
  Condition,
  SeriesStatus,
  Store,
  Editorial,
} from "./generated/prisma/enums";

export const seriesSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  author: z.string().max(255).optional().or(z.literal("")),
  editorial: z.enum(Editorial).optional().nullable(),
  status: z.enum(SeriesStatus),
  publishing: z.boolean(),
  totalVolumes: z.number().int().min(0).nullable(),
  coverImage: z.url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  retailPrice: z.number().min(0).nullable().optional(),
  malId: z.number().int().nullable().optional(),
});

export const volumeSchema = z.object({
  volumeNumber: z.number().int().min(1),
  title: z.string().max(255).optional().or(z.literal("")),
  owned: z.boolean(),
  read: z.boolean(),
  pricePaid: z.number().min(0).nullable().optional(),
  condition: z.enum(Condition),
  store: z.enum(Store).nullable().optional(),
  coverImage: z.url("Must be a valid URL").optional().or(z.literal("")),
  purchaseDate: z.date().nullable().optional(),
  readDate: z.date().nullable().optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type SeriesSchema = z.infer<typeof seriesSchema>;
export type VolumeSchema = z.infer<typeof volumeSchema>;
