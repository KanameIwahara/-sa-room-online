"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "preregister" | "complete";

const REDIRECT_COMPLETE_URL =
  "https://sa-room-online.vercel.app/login?mode=complete";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "sa">("student");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  // メールリンクから遷移してきた場合、自動ログインを即座に解除して本登録画面へ切り替える
  useEffect(() => {
    const initFromEmailLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const isCompleteParam = params.get("mode") === "complete";
      const hasAuthToken =
        window.location.hash.includes("access_token") ||
        window.location.hash.includes("refresh_token") ||
        params.has("code") ||
        params.has("token_hash");

      if (isCompleteParam || hasAuthToken) {
        // メールリンク経由で付与された自動ログインセッションを破棄
        await supabase.auth.signOut();

        // URLのトークンやクエリを整理して本登録モードへ
        window.history.replaceState(null, "", "/login?mode=complete");
        setMode("complete");
        setMessage({
          text: "メール確認が完了しました。役割（生徒／SA）・メールアドレス・パスワードを設定して本登録を完了してください。",
          type: "success",
        });
      }
    };

    initFromEmailLink();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "preregister") {
        // 仮登録：確認メールを送信（仮登録画面では役割・パスワードを表示しない）
        // Supabase signUp の仕様上ダミーパスワードを渡す必要があるため、本登録時に正しいパスワードで再登録する
        const tempSecret = crypto.randomUUID() + "Aa1!";
        const { error } = await supabase.auth.signUp({
          email,
          password: tempSecret,
          options: {
            emailRedirectTo: REDIRECT_COMPLETE_URL,
          },
        });

        if (error) throw error;

        setMessage({
          text: "仮登録メールを送信しました。メール内の「メールから本登録に進む」を押して本登録を完了してください。",
          type: "success",
        });
      } else if (mode === "complete") {
        // 本登録：役割（role）・メールアドレス・パスワードを設定して登録を確定
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: REDIRECT_COMPLETE_URL,
            data: {
              role,
            },
          },
        });

        if (signUpError) throw signUpError;

        // 自動ログイン状態が残るのを防ぐため一度サインアウトし、設定したパスワードでログインさせる
        await supabase.auth.signOut();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setMode("login");
          setMessage({
            text: "本登録が完了しました。設定したメールアドレスとパスワードでログインしてください。",
            type: "success",
          });
          return;
        }

        router.push("/questions");
        router.refresh();
      } else {
        // 通常ログイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/questions");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("認証エラー:", err);
      const errorMessage =
        err instanceof Error ? err.message : "処理に失敗しました";
      setMessage({
        text: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const titleText =
    mode === "preregister"
      ? "仮登録（メール送信）"
      : mode === "complete"
        ? "本登録（役割・パスワード設定）"
        : "ログイン";

  const descriptionText =
    mode === "preregister"
      ? "メールアドレスを入力してください。本登録用のリンクを送信します。"
      : mode === "complete"
        ? "役割とパスワードを設定して本登録を完了してください。"
        : "登録済みのメールアドレスとパスワードでログインしてください。";

  const submitButtonText = loading
    ? "処理中..."
    : mode === "preregister"
      ? "確認メールを送信する"
      : mode === "complete"
        ? "本登録を完了する"
        : "ログインする";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900">
            {titleText}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {descriptionText}
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
            {/* 本登録モード時のみ役割（生徒 / SA）を選択可能にする */}
            {mode === "complete" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アカウントの種類（役割）
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                      role === "student"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    生徒
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("sa")}
                    className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                      role === "sa"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    SA（質問対応）
                  </button>
                </div>
              </div>
            )}

            {/* メールアドレス（仮登録・本登録・ログインすべてで表示） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* パスワード（仮登録では非表示、本登録とログインで表示） */}
            {mode !== "preregister" && (
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
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition duration-150 disabled:opacity-50"
            >
              {submitButtonText}
            </button>
          </div>
        </form>

        {/* ログインと仮登録の切り替え */}
        <div className="text-center pt-4 border-t border-gray-100 space-y-2">
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => {
                setMode("preregister");
                setPassword("");
                setMessage(null);
              }}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              アカウントをお持ちでないですか？ 仮登録へ
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setPassword("");
                setMessage(null);
              }}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              すでにアカウントをお持ちですか？ ログインへ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
