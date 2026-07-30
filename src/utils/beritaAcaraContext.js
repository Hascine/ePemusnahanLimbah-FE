const BAP_FORM_CONTEXT_KEY = "beritaAcaraFormContext";

export const BAP_GROUPS = ["limbah-b3", "recall", "recall-precursor"];

export const DEFAULT_BAP_GROUP = "limbah-b3";

export const normalizeBapGroup = (group) => {
  return BAP_GROUPS.includes(group) ? group : DEFAULT_BAP_GROUP;
};

export const getBapPageAlias = (group) => {
  const normalizedGroup = normalizeBapGroup(group);
  if (normalizedGroup === "recall-precursor") return "berita-acara-recall-precursor-oot";
  if (normalizedGroup === "recall") return "berita-acara-recall";
  return "berita-acara-b3";
};

export const saveBapFormContext = (context = {}) => {
  const group = normalizeBapGroup(context.group);
  const payload = {
    group,
    pageAlias: context.pageAlias || getBapPageAlias(group),
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(BAP_FORM_CONTEXT_KEY, JSON.stringify(payload));
  return payload;
};

export const loadBapFormContext = () => {
  try {
    const raw = localStorage.getItem(BAP_FORM_CONTEXT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const group = normalizeBapGroup(parsed?.group);
    return {
      ...parsed,
      group,
      pageAlias: parsed?.pageAlias || getBapPageAlias(group),
    };
  } catch {
    localStorage.removeItem(BAP_FORM_CONTEXT_KEY);
    return null;
  }
};
