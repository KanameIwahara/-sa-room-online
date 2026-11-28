"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "preregister" | "complete";

const COMPLETE_PAGE_URL =
  "https://sa-room-online.vercel.app/login?mode=complete";

function getInitialMode(): AuthMode {
  if (typeof window === "undefined") return "login";
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "complete" ? "complete" : "login";
}

function getInitialEmail(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("email") ?? "";
}

function getInitialMessage(): {
  text: string;
  type: "error" | "success";
} | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "complete") {
    return {
      text: "役割（生徒／SA）・メールアドレス・パスワードを入力して本登録を完了してください。",
      type: "success",
    };
  }
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [email, setEmail] = useState<string>(getInitialEmail);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "sa">("student");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(getInitialMessage);

  // メールリンク経由のセッションが残っている場合のみサインアウトしてURLを整理する
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isComplete = params.get("mode") === "complete";
    const emailFromQuery = params.get("email");
    const hasHashToken =
      window.location.hash.includes("access_token") ||
      window.location.hash.includes("refresh_token") ||
      params.has("code") ||
      params.has("token_hash");

    if (!isComplete && !hasHashToken) {
      return;
    }

    let cancelled = false;

    const cleanupSession = async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("セッション解除エラー:", err);
      }

      if (cancelled) return;

      const cleanUrl = emailFromQuery
        ? `/login?mode=complete&email=${encodeURIComponent(emailFromQuery)}`
        : "/login?mode=complete";
      window.history.replaceState(null, "", cleanUrl);
    };

    void cleanupSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === "preregister") {
        // ③ 仮登録：本登録画面へ誘導するメールを送信
        const tempSecret = crypto.randomUUID() + "Aa1!";
        const redirectWithEmail = `${COMPLETE_PAGE_URL}&email=${encodeURIComponent(
          normalizedEmail,
        )}`;

        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: tempSecret,
          options: {
            emailRedirectTo: redirectWithEmail,
          },
        });

        if (error) throw error;

        setMessage({
          text: "確認メールを送信しました。メール内の「メールから本登録に進む」を押して本登録画面へ進んでください。",
          type: "success",
        });
      } else if (mode === "complete") {
        // ④〜⑤ 本登録：役割・メールアドレス・パスワードを登録し、完了後は①のログイン画面へ移る
        const { error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: COMPLETE_PAGE_URL,
            data: {
              role,
            },
          },
        });

        if (signUpError) throw signUpError;

        // 自動ログインさせず、⑤のログイン画面へ切り替え
        await supabase.auth.signOut();
        setPassword("");
        setMode("login");
        window.history.replaceState(null, "", "/login");
        setMessage({
          text: "本登録が完了しました。登録したメールアドレスとパスワードでログインしてください。",
          type: "success",
        });
      } else {
        // ①・⑥ ログイン画面でメールアドレスとパスワードを入力してログイン
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        router.push("/questions");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("認証エラー:", err);
      const rawMessage =
        err instanceof Error ? err.message : "処理に失敗しました";
      const friendlyMessage = rawMessage
        .toLowerCase()
        .includes("invalid login credentials")
        ? "メールアドレスまたはパスワードが正しくありません。"
        : rawMessage;
      setMessage({
        text: friendlyMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const titleText =
    mode === "preregister"
      ? "仮登録"
      : mode === "complete"
        ? "本登録"
        : "ログイン";

  const descriptionText =
    mode === "preregister"
      ? "メールアドレスを入力してください。本登録へ進むためのメールを送信します。"
      : mode === "complete"
        ? "役割・メールアドレス・パスワードを設定して本登録を完了してください。"
        : "メールアドレスとパスワードを入力してログインしてください。";

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
            {/* ④ 本登録画面：役割（生徒 / SA）の選択 */}
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

            {/* メールアドレス（①ログイン・②仮登録・④本登録で表示） */}
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

            {/* パスワード（②仮登録では非表示、④本登録と①ログインで表示） */}
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

        {/* ①ログインと②仮登録の切り替え */}
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
                window.history.replaceState(null, "", "/login");
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
