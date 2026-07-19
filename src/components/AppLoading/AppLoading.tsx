import { useI18n } from "../../hooks/useI18n";

export function AppLoading() {
  const { t } = useI18n();
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas">
      <p className="text-sm text-dim">{t("app.loading")}</p>
    </div>
  );
}
