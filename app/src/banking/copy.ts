import type { Layout } from "./finance";
export const shortfallCopy = {
  casual: (date: string, amount: string) =>
    `Heads up: on ${date} you'll be ${amount} short.`,
  plain: (date: string, amount: string) =>
    `On ${date} you'll be ${amount} short.`,
  brisk: (date: string, amount: string) =>
    `On ${date} you'll be ${amount} short.`,
  calm: (date: string, amount: string) =>
    `Your account is forecast to be ${amount} short on ${date}.`,
};
export const explanations: Record<Layout, string> = {
  Play: "Your age band and small everyday payments point to a home that leads with learning by trying.",
  Plan: "Steady income, a regular saving habit and a savings goal point to a home that leads with planning.",
  Month:
    "Recurring household payments point to a home that leads with the month ahead.",
};
