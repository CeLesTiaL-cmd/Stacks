import { Component } from "react";
import { RefreshCw } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import Button from "./ui/Button.jsx";

function Fallback() {
  const { t } = useI18n();
  return (
    <div className="container-x py-24 text-center">
      <h1 className="font-display text-3xl font-bold tracking-display">{t("err.boundaryTitle")}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">{t("err.boundaryText")}</p>
      <Button className="mt-6" onClick={() => window.location.reload()} iconStart={<RefreshCw className="size-4" />}>{t("common.reload")}</Button>
    </div>
  );
}
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error(error); }
  render() { return this.state.error ? <Fallback /> : this.props.children; }
}
