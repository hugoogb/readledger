import { TooltipPayloadEntry } from "recharts";

export type BaseTooltipProps = {
    active?: boolean;
    label?: string;
    payload?: TooltipPayloadEntry<number, string>[];
};
