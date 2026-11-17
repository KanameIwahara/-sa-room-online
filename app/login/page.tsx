"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "sa">("student");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            },
          },
        });

        if (error) throw error;
        setMessage({
          text: "アカウントを作成しました！ログインしてください。",
          type: "success",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/questions");
        router.refresh();
      }
    } catch (err: any) {
      console.error("認証エラー:", err);
      setMessage({
        text: err.message || "処理に失敗しました",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900">
            {isSignUp ? "アカウントを新規作成" : "ログイン"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp
              ? "区分を選択し、情報を入力してアカウントを作成してください"
              : "登録済みのメールアドレスとパスワードでログインしてください"}
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "error"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-green-50 text-green-600 border border-green-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アカウント区分
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-2 px-4 border rounded-lg text-sm font-medium transition ${
                      role === "student"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    👨‍🎓 生徒
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("sa")}
                    className={`py-2 px-4 border rounded-lg text-sm font-medium transition ${
                      role === "sa"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    🧑‍🏫 SA（先輩）
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition duration-150 disabled:opacity-50"
            >
              {loading
                ? "処理中..."
                : isSignUp
                  ? `${role === "sa" ? "SA（先輩）" : "生徒"} として登録`
                  : "ログインする"}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            {isSignUp
              ? "すでにアカウントをお持ちですか？ ログインへ"
              : "アカウントをお持ちでないですか？ 新規登録へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
