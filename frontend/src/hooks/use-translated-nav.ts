import { useTranslation } from "react-i18next";
import { getNavForRole, type NavItem } from "@/lib/nav";

export function useTranslatedNav(role: Parameters<typeof getNavForRole>[0]): NavItem[] {
  const { t } = useTranslation();
  return getNavForRole(role).map((item) => ({
    ...item,
    label: t(item.labelKey),
  }));
}

export function useRoleTitle(role: Parameters<typeof getNavForRole>[0]): string {
  const { t } = useTranslation();
  switch (role) {
    case "doctor":
      return t("nav.role.doctor");
    case "admin":
      return t("nav.role.admin");
    default:
      return t("nav.role.patient");
  }
}
