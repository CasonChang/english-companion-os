import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "./I18nProvider";
import { LanguageToggle } from "./LanguageToggle";
function Sample() { const { t } = useI18n(); return <><span>{t("Home")}</span><LanguageToggle/></>; }
describe("language preference", () => { beforeEach(() => localStorage.clear()); it("defaults to Traditional Chinese and can persist English", async () => { const user=userEvent.setup(); const { unmount }=render(<I18nProvider><Sample/></I18nProvider>); expect(screen.getByText("首頁")).toBeInTheDocument(); await user.click(screen.getByRole("button",{name:"EN"})); expect(screen.getByText("Home")).toBeInTheDocument(); unmount(); render(<I18nProvider><Sample/></I18nProvider>); expect(screen.getByText("Home")).toBeInTheDocument(); }); });
