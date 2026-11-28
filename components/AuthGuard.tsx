"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PUBLIC_PATHS = ["/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const isPublicPath = PUBLIC_PATHS.includes(pathname);

      if (!session && !isPublicPath) {
        // 未ログインで保護ページにアクセス → ログイン画面へ
        router.replace("/login");
      } else if (session && isPublicPath) {
        // ログイン済みで /login にアクセス → 質問一覧へ
        router.replace("/questions");
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isPublicPath = PUBLIC_PATHS.includes(pathname);
      if (!session && !isPublicPath) {
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (isChecking && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        読み込み中...
      </div>
    );
  }

  return <>{children}</>;
}
