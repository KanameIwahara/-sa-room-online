"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Question = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

type Answer = {
  id: string;
  question_id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
};

// 1. 中身の処理を別コンポーネントに分ける
function QuestionDetailContent() {
  const params = useParams();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!questionId) return;

    const { data: qData, error: qError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (qError) console.error("質問取得エラー:", qError);
    if (qData) setQuestion(qData);

    const { data: aData, error: aError } = await supabase
      .from("answers")
      .select("*")
      .eq("question_id", questionId)
      .order("created_at", { ascending: true });

    if (aError) console.error("返信取得エラー:", aError);
    if (aData) setAnswers(aData);
  }, [questionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
    const filePath = `answers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, file);

    if (uploadError) {
      console.error("画像アップロードエラー:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("attachments")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const { error } = await supabase.from("answers").insert([
        {
          question_id: questionId,
          content: content,
          image_url: imageUrl,
        },
      ]);

      if (error) throw error;

      setContent("");
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchData();
    } catch (err) {
      console.error("送信エラー:", err);
      alert("送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question)
    return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/questions"
          className="text-sm text-gray-500 hover:underline"
        >
          ← 質問一覧に戻る
        </Link>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-400 mb-2">
            投稿日時: {new Date(question.created_at).toLocaleString("ja-JP")}
          </p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {question.title}
          </h1>
          <p className="text-gray-700 whitespace-pre-wrap">
            {question.content}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-md font-bold text-gray-700">
            やり取り一覧 ({answers.length}件)
          </h2>

          {answers.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-400 text-sm">
              まだ返信はありません。最初のメッセージを投稿してみましょう！
            </div>
          ) : (
            answers.map((ans) => (
              <div
                key={ans.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2"
              >
                <div className="text-xs text-gray-400">
                  {new Date(ans.created_at).toLocaleString("ja-JP")}
                </div>
                {ans.content && (
                  <p className="text-gray-800 whitespace-pre-wrap text-sm">
                    {ans.content}
                  </p>
                )}
                {ans.image_url && (
                  <div className="mt-2 max-w-sm rounded-lg overflow-hidden border">
                    {/* eslint-disable-next-html-next/no-img-element */}
                    <img
                      src={ans.image_url}
                      alt="添付画像"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-md space-y-3"
        >
          {filePreview && (
            <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
              {/* eslint-disable-next-html-next/no-img-element */}
              <img
                src={filePreview}
                alt="プレビュー"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}

          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="返信・メッセージを入力..."
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          <div className="flex items-center justify-between">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />

            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && !selectedFile)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg disabled:opacity-50 transition"
            >
              {isSubmitting ? "送信中..." : "送信する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. メインのページコンポーネントで Suspense で包んで export する
export default function QuestionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500">読み込み中...</div>
      }
    >
      <QuestionDetailContent />
    </Suspense>
  );
}
