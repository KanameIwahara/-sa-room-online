"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function NewQuestionPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // ファイル選択時のハンドラー
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 画像の場合はプレビュー用URLを作成
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  // 選択したファイルを解除
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // 1. ファイルが選択されていれば question-images バケットにアップロード
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `questions/${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("question-images")
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error("画像アップロード失敗:", uploadError);
          alert("ファイルのアップロードに失敗しました");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("question-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // 2. 質問データの保存
      const { error } = await supabase
        .from("questions")
        .insert([{ title, content, image_url: imageUrl }]);

      if (error) {
        console.error("保存失敗:", error);
        alert("データベースへの保存に失敗しました");
        return;
      }

      // 保存成功したら質問一覧ページへ移動
      router.push("/questions");
      router.refresh();
    } catch (err) {
      console.error("送信エラー:", err);
      alert("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="mb-8">
          <Link
            href="/questions"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-4"
          >
            ← 質問一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            新しい質問を投稿する
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            知りたいことや困っていることを詳しく入力してください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* 添付ファイル追加エリア */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ファイルを添付（任意）
            </label>

            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">
                      クリックしてファイルを選択
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, GIF など
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
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
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
                {/* 画像プレビュー */}
                {filePreview && (
                  <div className="relative w-full max-h-48 overflow-hidden rounded-lg border border-gray-200">
                    <Image
                      src={filePreview}
                      alt="添付プレビュー"
                      width={600}
                      height={400}
                      unoptimized
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ボタンエリア */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Link
              href="/questions"
              className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition duration-150"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "保存中..." : "質問を投稿する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
