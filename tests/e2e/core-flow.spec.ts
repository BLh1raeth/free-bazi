import { expect, test } from "@playwright/test";

test("用户可完成排盘并无刷新切换时间层级", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /把出生时间/ })).toBeVisible();
  const yearInput = page.getByLabel("出生年份");
  await yearInput.fill("");
  await expect(yearInput).toHaveValue("");
  await yearInput.fill("1990");
  await page.getByLabel("出生月份").fill("6");
  await page.getByLabel("出生日期").fill("15");
  await page.getByLabel("出生地点").selectOption("shenzhen");
  await page.getByRole("button", { name: "生成命盘" }).click();
  await expect(page).toHaveURL(/\/chart\?id=/);
  await expect(page.getByRole("heading", { name: "四柱命盘" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "神煞" })).toBeVisible();
  await expect(page.getByText(/子平古籍基础表诀 v1/)).toBeVisible();
  await page.getByRole("button", { name: "流年", exact: true }).click();
  await expect(page.getByRole("heading", { name: "流年" })).toBeVisible();
  await page.getByRole("button", { name: "流月", exact: true }).click();
  await expect(page.getByRole("heading", { name: /流月/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /流月/ })).toBeVisible();
  await page.getByRole("button", { name: "导出", exact: true }).click();
  await expect(
    page.locator("#export-document").getByRole("heading", { name: "四柱命盘" }),
  ).toBeVisible();
  await expect(
    page.locator("#export-document").getByRole("heading", { name: "大运" }),
  ).toBeVisible();
});

test("移动端表单与免费承诺可读", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "只在移动端项目验证");
  await page.goto("/");
  await expect(page.getByText("元序", { exact: true })).toBeVisible();
  await expect(
    page.getByText("永久免费 · 无次数限制 · 免费导出", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "生成命盘" })).toBeVisible();
  expect(await page.locator("#location option").count()).toBeGreaterThan(70);
  for (const elementClass of [
    "element-wood",
    "element-fire",
    "element-earth",
    "element-metal",
    "element-water",
  ]) {
    await expect(page.locator(`.${elementClass}`).first()).toBeVisible();
  }
});
