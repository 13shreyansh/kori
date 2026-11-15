// No transactions or computed amounts enter this request. Gemini chooses a block only.
const allowed = [
  "receipt",
  "plan-timeline",
  "payday-runway",
  "coming-up",
  "baskets",
  "unsupported",
];
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST only" });
  const question =
    typeof req.body?.question === "string"
      ? req.body.question.slice(0, 1000)
      : "";
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(200).json({ fallback: true });
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-flash-latest"}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(5200),
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'Route a banking question. Return JSON only: {"block":"receipt|plan-timeline|payday-runway|coming-up|baskets|unsupported","params":{"category":"wolt|cafe|groceries|subscriptions|hockey|saturday|lunch|taxi","monthly":number,"ticket":number,"year":boolean}}. Only copy numbers explicitly in the question. Never calculate, answer, or write prose. Save per month or goal dates means plan-timeline. Afford a ticket means payday-runway. Bills before payday means coming-up. What kind of spender am I, or where my money goes, means baskets. Merchant or category spending means receipt. Otherwise unsupported. Omit unused parameters.',
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: question }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
            maxOutputTokens: 120,
          },
        }),
      },
    );
    if (!response.ok) return res.status(200).json({ fallback: true });
    const data = await response.json();
    const out = JSON.parse(
      data.candidates?.[0]?.content?.parts?.map((x) => x.text || "").join("") ||
        "{}",
    );
    if (!allowed.includes(out.block)) throw Error("Invalid block");
    const params = {};
    if (
      [
        "wolt",
        "cafe",
        "groceries",
        "subscriptions",
        "hockey",
        "saturday",
        "lunch",
        "taxi",
      ].includes(out.params?.category)
    )
      params.category = out.params.category;
    for (const field of ["monthly", "ticket"])
      if (
        Number.isFinite(out.params?.[field]) &&
        out.params[field] >= 0 &&
        question.includes(String(out.params[field]))
      )
        params[field] = out.params[field];
    if (out.params?.year === true) params.year = true;
    return res.status(200).json({ block: out.block, params });
  } catch {
    return res.status(200).json({ fallback: true });
  }
}
