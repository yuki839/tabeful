import { login } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          {/* ロゴ（仮） */}
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl">
              T
            </div>
          </div>

          <CardTitle className="text-2xl font-bold">TABEful</CardTitle>

          <CardDescription className="text-sm text-muted-foreground">
            食べ歩き × 旅のしおり
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form>
            <Button
              formAction={login}
              className="w-full flex items-center gap-3"
              size="lg"
            >
              {/* Google風アイコン（簡易） */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.66 1.22 9.13 3.22l6.84-6.84C35.77 2.13 30.28 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.36 13.05 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.64-.15-3.22-.42-4.74H24v9.02h12.94c-.56 3.01-2.24 5.56-4.77 7.28l7.73 6c4.51-4.17 7.08-10.3 7.08-17.56z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.54 28.43c-.48-1.43-.76-2.95-.76-4.43s.27-3 .76-4.43l-7.98-6.2C.92 16.11 0 19.01 0 24s.92 7.89 2.56 11.63l7.98-6.2z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.91-5.81l-7.73-6c-2.15 1.44-4.9 2.29-8.18 2.29-6.26 0-11.64-3.55-13.46-8.43l-7.98 6.2C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              Googleでログイン
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-xs text-center text-muted-foreground">
          ログインすることで利用規約に同意したものとみなします
        </CardFooter>
      </Card>
    </div>
  );
}
