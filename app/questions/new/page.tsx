"use client";

import { useState } from "react";

export default function NewQuestionPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // UIテスト用の仮ハンドラー（後でSupabaseへのデータ保存処理に置き換えます）
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`【UIテスト】\nタイトル: ${title}\n内容: ${content}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            新しい質問を投稿する
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            知りたいことや困っていることを詳しく入力してください。
          </p>
        </div>

        {/* 質問フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* タイトル入力 */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              質問のタイトル
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: Next.jsとSupabaseの連携でエラーが出る"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* 内容入力 */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              質問の詳細内容
            </label>
            <textarea
              id="content"
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="発生しているエラーや試したこと、具体的な状況を書いてください..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
            />
          </div>

          {/* ボタンエリア */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              質問を投稿する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
