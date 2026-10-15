"use client";

import Link from "next/link";

// UI確認用のダミーデータ（後でSupabaseから取得するデータに差し替えます）
const dummyQuestions = [
  {
    id: "1",
    title: "Next.jsとSupabaseの連携で環境変数が読み込めない",
    content:
      ".env.localに設定した環境変数がprocess.envで取得できません。再起動以外に対処法はありますか？",
    createdAt: "2026-10-15",
    author: "ユーザーA",
  },
  {
    id: "2",
    title: "Tailwind CSSでレスポンシブデザインを作るコツ",
    content:
      "スマホ表示とPC表示でレイアウトを大きく崩さずに切り替えるためのクラス指定方法について知りたいです。",
    createdAt: "2026-10-14",
    author: "ユーザーB",
  },
];

export default function QuestionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">質問一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              投稿された質問を確認・回答できます
            </p>
          </div>
          <Link
            href="/questions/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition duration-150"
          >
            新規質問を投稿
          </Link>
        </div>

        {/* 質問カード一覧 */}
        <div className="space-y-4">
          {dummyQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>投稿者: {q.author}</span>
                <span>{q.createdAt}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition">
                {q.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {q.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
