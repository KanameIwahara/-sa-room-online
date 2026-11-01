"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// 質問データの型定義
type Question = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function QuestionListPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabaseから質問一覧を取得
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .order("created_at", { ascending: false }); // 新しい順

        if (error) {
          console.error("質問一覧の取得失敗:", error);
          return;
        }

        setQuestions(data || []);
      } catch (err) {
        console.error("エラー:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダーエリア */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">質問一覧</h1>
            <p className="text-sm text-gray-500 mt-1">
              投稿された質問や相談を確認できます。
            </p>
          </div>
          <Link
            href="/questions/new" // 質問作成画面へのリンク（※パスは環境に合わせて調整してください）
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition duration-150"
          >
            新規質問をする
          </Link>
        </div>

        {/* 質問リストエリア */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : questions.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500">
            まだ質問がありません。「新規質問をする」から投稿してみましょう！
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map((question) => (
              <Link
                key={question.id}
                href={`/questions/${question.id}`} // 詳細ページへ遷移
                className="block bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition duration-150"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition">
                    {question.title}
                  </h2>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                    {new Date(question.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                  {question.content}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
