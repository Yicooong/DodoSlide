// 导入 clsx 库，用于条件类名合并
import { clsx, type ClassValue } from "clsx";
// 导入 tailwind-merge，用于解决 Tailwind CSS 类名冲突
import { twMerge } from "tailwind-merge";

/**
 * 合并 CSS 类名并解决 Tailwind 冲突
 * 使用 clsx 处理条件类名，再用 twMerge 解决 Tailwind 类名覆盖问题
 * @param inputs 任意数量的类名值（字符串、对象、数组等）
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
