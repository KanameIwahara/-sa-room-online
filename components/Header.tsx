"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(data?.role ?? "student");
      } else {
        setUserEmail(null);
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchUserAndRole();

    // ログイン・ログアウト状態の変化をリアルタイムに監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUserEmail(session.user.email ?? null);
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          setUserRole(data?.role ?? "student");
        } else {
          setUserEmail(null);
          setUserRole(null);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setUserRole(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* アプリロゴ・トップへのリンク */}
        <Link href="/questions" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-indigo-600">QA Station</span>
        </Link>

        {/* 右側：ログイン状態とログアウト/ログインボタン */}
        <div className="flex items-center space-x-4">
          {!loading && (
            <>
              {userEmail ? (
                <div className="flex items-center space-x-3">
                  {/* ロールバッジ表示 */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      userRole === "sa"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {userRole === "sa" ? "🧑‍🏫 SA（先輩）" : "👨‍🎓 生徒"}
                  </span>

                  {/* メールアドレス（PC画面のみ表示） */}
                  <span className="hidden sm:inline text-xs text-gray-500">
                    {userEmail}
                  </span>

                  {/* ログアウトボタン */}
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-lg transition"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  ログイン / 新規登録
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
