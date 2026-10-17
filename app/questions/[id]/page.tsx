"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Question = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

export default function QuestionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchQuestion = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("取得エラー:", error);
        } else {
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
      <div className="min-h-screen bg-gray-50 py-12 px-4 text-center text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 text-center text-gray-500">
        質問が見つかりませんでした。
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <Link
          href="/questions"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-6"
        >
          ← 質問一覧に戻る
        </Link>

        <div className="border-b border-gray-100 pb-4 mb-6">
          <span className="text-xs text-gray-400">
            投稿日時:{" "}
            {new Date(question.created_at).toLocaleDateString("ja-JP")}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {question.title}
          </h1>
        </div>

        {/* 本文 */}
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
          {question.content}
        </div>

        {/* 添付画像表示 */}
        {question.image_url && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">
              添付画像
            </h2>
            <div className="rounded-lg overflow-hidden border border-gray-200 max-w-lg">
              {/* eslint-disable-next-html-next/no-img-element */}
              <img
                src={question.image_url}
                alt="添付画像"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
