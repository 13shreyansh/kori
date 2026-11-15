export interface Route {
  block:
    "receipt" | "plan-timeline" | "payday-runway" | "coming-up" | "baskets" | "unsupported";
  params: {
    category?: string;
    monthly?: number;
    ticket?: number;
    year?: boolean;
  };
}
export function localRoute(q: string): Route {
  const s = q.toLowerCase();
  if (/save|saving.*month|car|japan|own home/.test(s))
    return {
      block: "plan-timeline",
      params: {
        monthly: Number(s.match(/(?:€|save\s+)(\d+)/)?.[1] || 0) || undefined,
      },
    };
  if (/afford|ticket|safe.*spend/.test(s))
    return {
      block: "payday-runway",
      params: { ticket: Number(s.match(/€(\d+)/)?.[1] || 0) },
    };
  if (/kind of spender|what type of spender|where (does|did) my money|baskets|spending habits/.test(s))
    return { block: "baskets", params: {} };
  if (/before payday|coming|goes out|bills/.test(s))
    return { block: "coming-up", params: {} };
  if (
    /wolt|deliver|café|cafe|grocer|subscription|hockey|saturday|lunch|taxi|taxis|cab/.test(s)
  )
    return {
      block: "receipt",
      params: {
        category: /wolt|deliver/.test(s)
          ? "wolt"
          : /café|cafe/.test(s)
            ? "cafe"
            : /grocer/.test(s)
              ? "groceries"
              : /subscription/.test(s)
                ? "subscriptions"
                : /hockey/.test(s)
                  ? "hockey"
                  : /saturday/.test(s)
                    ? "saturday"
                    : /taxi|cab/.test(s)
                      ? "taxi"
                      : "lunch",
        year: /\byear(?:ly)?\b|\bannual(?:ly)?\b/.test(s),
      },
    };
  return { block: "unsupported", params: {} };
}
export async function routeQuestion(question: string): Promise<Route> {
  const fallback = localRoute(question);
  try {
    const r = await fetch("/api/route", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(10500),
    });
    if (!r.ok) return fallback;
    const data = await r.json();
    if (
      ![
        "receipt",
        "plan-timeline",
        "payday-runway",
        "coming-up",
        "baskets",
        "unsupported",
      ].includes(data.block)
    )
      return fallback;
    return data as Route;
  } catch {
    return fallback;
  }
}
