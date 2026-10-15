"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Question = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("データ取得エラー:", error);
        } else if (data) {
          setQuestion(data);
        }
      } catch (err) {
        console.error("エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-center text-gray-500">
        データを読み込み中...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 text-center">
        <p className="text-gray-500 mb-4">
          指定された質問が見つかりませんでした。
        </p>
        <Link
          href="/questions"
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← 質問一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 戻るボタン */}
        <Link
          href="/questions"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition"
        >
          ← 質問一覧に戻る
        </Link>

        {/* 質問詳細カード */}
        <article className="bg-white p-8 rounded-xl shadow-md border border-gray-100 space-y-6">
          {/* メタ情報 */}
          <div className="border-b border-gray-100 pb-4">
            <span className="text-xs text-gray-400">
              投稿日時: {new Date(question.created_at).toLocaleString("ja-JP")}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {question.title}
            </h1>
          </div>

          {/* 質問本文 */}
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {question.content}
          </div>
        </article>
      </div>
    </div>
  );
}
