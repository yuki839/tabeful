'use server'

import { createClient } from "@/utils/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function login(formData?: FormData){
    //Googleログイン
    const supabase = await createClient()
    const headersList = await headers()
    const origin = headersList.get("origin") ?? "http://localhost:3000"
    const nextParam = typeof formData?.get("next") === "string"
      ? String(formData.get("next"))
      : "/"
    const redirectUrl = new URL("/auth/callback", origin)
    redirectUrl.searchParams.set("next", nextParam)
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider : 'google',
        options: {
            redirectTo: redirectUrl.toString(),
        },
})
    if (error) {
        console.error(error);
    }

    if (data.url) {
    redirect(data.url) 
    }

}

export async function logout(){
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error(error);
    }

    redirect("/login");
}

