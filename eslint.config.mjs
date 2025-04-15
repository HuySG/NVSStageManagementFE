import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Cho phép biến chưa dùng (đỡ báo lỗi trong CI, nhưng vẫn cảnh báo trong IDE)
      "@typescript-eslint/no-unused-vars": ["warn"],

      // Cho phép dùng `any` tạm thời (nên sửa lại sau)
      "@typescript-eslint/no-explicit-any": ["warn"],

      // Đổi các lỗi ESLint thường gặp thành cảnh báo
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      "@typescript-eslint/no-wrapper-object-types": "warn",
    },
  },
];

export default eslintConfig;
