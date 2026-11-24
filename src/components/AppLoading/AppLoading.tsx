import { Paragraph, View } from "@hozo/core";
import { useI18n } from "../../hooks/useI18n";

export function AppLoading() {
  const { t } = useI18n();
  return (
    <View className="flex flex-row h-screen w-screen items-center justify-center bg-canvas">
      <Paragraph className="text-sm text-dim">{t("app.loading")}</Paragraph>
    </View>
  );
}
