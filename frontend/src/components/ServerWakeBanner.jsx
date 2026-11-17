import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "../api/client.js";
import { useI18n } from "../i18n/index.jsx";

/** Free-tier servers sleep; explain the slow first load instead of leaving a blank page. */
export default function ServerWakeBanner() {
  const { t } = useI18n();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    let done = false;
    const timer = setTimeout(() => !done && setSlow(true), 3500);
    api.get("/api/health", { timeout: 90000 }).catch(() => {}).finally(() => { done = true; clearTimeout(timer); setSlow(false); });
    return () => clearTimeout(timer);
  }, []);
  if (!slow) return null;
  return (
    <div role="status" className="border-b border-warn/30 bg-warn/10"><div className="container-x flex items-center gap-2 py-2 text-sm text-ink"><Loader2 className="size-4 shrink-0 animate-spin text-warn" />{t("wake.text")}</div></div>
  );
}
