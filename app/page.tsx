"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  useEffect(() => {
    const testConnection = async () => {
      // Supabaseへのテストリクエスト
      const { data, error } = await supabase.from("test").select("*");
      console.log("Supabase接続テスト:", { data, error });
    };

    testConnection();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">sa-room-online</h1>
      <p>Supabase 接続テスト中...</p>
    </main>
  );
}
