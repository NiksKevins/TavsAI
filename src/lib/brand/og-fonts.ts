import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function loadOgFonts() {
  const dir = join(process.cwd(), "src/app/fonts");
  const [syne, manropeMedium, manropeSemi] = await Promise.all([
    readFile(join(dir, "Syne-Bold.ttf")),
    readFile(join(dir, "Manrope-Medium.ttf")),
    readFile(join(dir, "Manrope-SemiBold.ttf")),
  ]);

  return [
    { name: "Syne", data: syne, weight: 700 as const, style: "normal" as const },
    {
      name: "Manrope",
      data: manropeMedium,
      weight: 500 as const,
      style: "normal" as const,
    },
    {
      name: "Manrope",
      data: manropeSemi,
      weight: 600 as const,
      style: "normal" as const,
    },
  ];
}
