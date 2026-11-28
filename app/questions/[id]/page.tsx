"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
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

type Answer = {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

function QuestionDetailContent() {
  const params = useParams();
  const id = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  // SA判定と返信フォーム用
  const [isSA, setIsSA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 回答一覧を取得する関数
  const fetchAnswers = useCallback(async () => {
    const { data, error } = await supabase
      .from("answers")
      .select("*")
      .eq("question_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("回答取得エラー:", error);
    } else if (data) {
      setAnswers(data);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const init = async () => {
      try {
        // 1. ログインユーザーと役割（SAかどうか）を確認
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          let role = user.user_metadata?.role;
          if (!role) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single();
            role = profile?.role;
          }
          setIsSA(role === "sa");
        }

        // 2. 質問詳細を取得
        const { data: qData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", id)
          .single();

        if (qError) {
          console.error("取得エラー:", qError);
        } else {
          setQuestion(qData);
        }

        // 3. 回答一覧を取得
        await fetchAnswers();
      } catch (err) {
        console.error("エラー:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, fetchAnswers]);

  // ファイル選択時
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  // ファイル解除
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  // SAの返信送信処理（ファイルアップロード込み）
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !userId) return;

    setSubmitting(true);
    try {
      let uploadedImageUrl: string | null = null;

      // 添付ファイルがある場合はSupabase Storageにアップロード
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `answers/${id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(fileName);

        uploadedImageUrl = publicUrlData.publicUrl;
      }

      // 回答データをDBに保存
      const { error } = await supabase.from("answers").insert({
        question_id: id,
        user_id: userId,
        content: replyContent.trim(),
        image_url: uploadedImageUrl,
      });

      if (error) throw error;

      // フォームをリセットして再読み込み
      setReplyContent("");
      handleRemoveFile();
      await fetchAnswers();
    } catch (err) {
      console.error("回答投稿エラー:", err);
      alert("回答の投稿に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 質問カード */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
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

          {/* 質問の添付画像表示 */}
          {question.image_url && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 mb-3">
                添付ファイル
              </h2>
              {question.image_url.toLowerCase().endsWith(".pdf") ? (
                <a
                  href={question.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-indigo-600 hover:underline font-medium"
                >
                  📄 添付PDFを開く
                </a>
              ) : (
                <div className="rounded-lg overflow-hidden border border-gray-200 max-w-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={question.image_url}
                    alt="添付画像"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 回答一覧セクション */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            SAからの回答（{answers.length}件）
          </h2>

          {answers.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">まだ回答はありません。</p>
          ) : (
            <div className="space-y-4">
              {answers.map((ans) => (
                <div
                  key={ans.id}
                  className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold text-indigo-700">
                      🧑‍🏫 SA（先輩）
                    </span>
                    <span>
                      {new Date(ans.created_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                    {ans.content}
                  </p>

                  {/* 回答の添付ファイル表示 */}
                  {ans.image_url && (
                    <div className="pt-2">
                      {ans.image_url.toLowerCase().endsWith(".pdf") ? (
                        <a
                          href={ans.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:underline font-medium"
                        >
                          📄 添付PDFを開く
                        </a>
                      ) : (
                        <div className="rounded-lg overflow-hidden border border-indigo-200 max-w-md bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ans.image_url}
                            alt="回答の添付画像"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SA専用の返信フォーム */}
          {isSA && (
            <form
              onSubmit={handleReplySubmit}
              className="mt-6 pt-6 border-t border-gray-100 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  回答を入力する（SA専用）
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="質問への回答を入力してください..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* SA返信用の添付ファイルエリア */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ファイルを添付（任意）
                </label>

                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">
                          クリックしてファイルを選択
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF, PDF など
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium truncate max-w-xs">
                        📎 {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        削除
                      </button>
                    </div>
                    {filePreview && (
                      <div className="relative w-full max-h-48 overflow-hidden rounded-lg border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={filePreview}
                          alt="添付プレビュー"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
                >
                  {submitting ? "送信中..." : "回答を投稿する"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-12 px-4 text-center text-gray-500">
          読み込み中...
        </div>
      }
    >
      <QuestionDetailContent />
    </Suspense>
  );
}
