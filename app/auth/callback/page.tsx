"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // ← 普段 login/page.tsx で import しているパスに書き換えてください

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // URLの ?code=... からセッションを確立する
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href,
      );
      if (error) {
        console.error("Auth callback error:", error);
        router.replace("/login?error=auth_failed");
      } else {
        router.replace("/"); // ログイン完了後にトップページへ
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-600">ログインを確認しています...</p>
    </div>
  );
}
