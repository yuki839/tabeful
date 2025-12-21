"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react"; // lucide-reactのアイコン

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("error.tsxで受け取ったエラー", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-green-100 p-4 rounded-full">
            <AlertCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          操作中に問題が発生しました
        </h2>
        <p className="text-gray-600">
          ご注文の操作中にエラーが発生しました。もう一度お試しいただけますか？
        </p>
        <p className="text-sm text-gray-400">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition"
        >
          再試行する
        </button>
      </div>
    </div>
  );
}
