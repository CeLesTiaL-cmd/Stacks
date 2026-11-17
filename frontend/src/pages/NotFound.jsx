import { Compass } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import Button from "../components/ui/Button.jsx";
export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <Compass className="size-10 text-subtle" strokeWidth={1.5} />
      <p className="mt-4 font-display text-7xl font-bold tracking-display">404</p>
      <p className="mt-2 text-muted">{t("nf.text")}</p>
      <Button to="/" className="mt-6">{t("nf.home")}</Button>
    </div>
  );
}
