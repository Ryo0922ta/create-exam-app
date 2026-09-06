import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "解答用紙作成アプリ - CSVプレビュー (Phase 1)",
    description: "4択問題CSVをアップロードしてプレビュー表示するWebアプリ",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className="min-h-screen bg-gray-50 antialiased">
                {children}
            </body>
        </html>
    );
}
