"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Question = {
  id: string;
  title: string;
  content: string;
  is_resolved: boolean;
  created_at: string;
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("質問一覧の取得エラー:", error);
      } else if (data) {
        setQuestions(data);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
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

        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : questions.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500">
            まだ質問が投稿されていません。「新規質問を投稿」から最初の質問を作ってみましょう！
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <Link
                key={q.id}
                href={`/questions/${q.id}`}
                className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  {/* ステータスバッジ */}
                  {q.is_resolved ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      ✅ 解決済み
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      💡 回答受付中
                    </span>
                  )}

                  <span className="text-xs text-gray-400">
                    {new Date(q.created_at).toLocaleString("ja-JP")}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition">
                  {q.title}
                </h2>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {q.content}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
