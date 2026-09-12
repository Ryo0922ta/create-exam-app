import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "解答用紙作成アプリ - CSVプレビュー & 定期考査エディタ",
    description: "4択・単語・記述対応の定期考査・問題用紙・解答用紙作成アプリ",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen bg-gray-50 antialiased">
                {children}
            </body>
        </html>
    );
}
