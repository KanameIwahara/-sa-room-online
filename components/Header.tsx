"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [onlineSaCount, setOnlineSaCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // 1. ログインユーザー情報とロール（生徒 / SA）の取得
  useEffect(() => {
    const fetchUserAndRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(data?.role ?? "student");
      } else {
        setUserId(null);
        setUserEmail(null);
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchUserAndRole();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email ?? null);
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          setUserRole(data?.role ?? "student");
        } else {
          setUserId(null);
          setUserEmail(null);
          setUserRole(null);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  // 2. SAのオンライン人数をリアルタイム監視＆自分がSAならオンライン登録
  useEffect(() => {
    const channel = supabase.channel("online-sas", {
      config: {
        presence: {
          key: userId ?? `guest-${Math.random()}`,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        let count = 0;
        Object.values(state).forEach((presences) => {
          const isSa = (presences as Array<{ role?: string }>).some(
            (p) => p.role === "sa",
          );
          if (isSa) count++;
        });
        setOnlineSaCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && userRole === "sa" && userId) {
          await channel.track({
            role: "sa",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setUserEmail(null);
    setUserRole(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* 左側：アプリロゴとオンラインSA人数表示 */}
        <div className="flex items-center space-x-4">
          <Link href="/questions" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-indigo-600">
              QA Station
            </span>
          </Link>

          {/* オンライン中のSA人数バッジ */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700">
            <span
              className={`w-2 h-2 rounded-full ${
                onlineSaCount > 0
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <span>
              オンライン中のSA:{" "}
              <strong className="text-gray-900">{onlineSaCount}人</strong>
            </span>
          </div>
        </div>

        {/* 右側：ログイン状態とログアウト/ログインボタン */}
        <div className="flex items-center space-x-4">
          {!loading && (
            <>
              {userEmail ? (
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      userRole === "sa"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {userRole === "sa" ? "🧑‍🏫 SA（先輩）" : "👨‍🎓 生徒"}
                  </span>

                  <span className="hidden sm:inline text-xs text-gray-500">
                    {userEmail}
                  </span>

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
