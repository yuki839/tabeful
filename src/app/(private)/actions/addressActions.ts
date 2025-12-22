"use server"
import { getPlaceDetails } from "@/lib/restaurants/api";
import { AddressSuggestion } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function selectSuggestionAction
(suggestion:AddressSuggestion,sessionToken:string) {

    const supabase = await createClient();

    console.log("serverActionsSuggestion",suggestion);

    const {data: locationData, error} = await getPlaceDetails(
        suggestion.placeId,
         ["location"],
         sessionToken
    );
    console.log("locationData",locationData)

    if(error ||
         !locationData ||
         !locationData.location ||
         !locationData.location.latitude ||
         !locationData.location.longitude) {
        throw new Error("住所情報を取得できませんでした");
    }

    
    const {data: {user}, error:userError} = await supabase.auth.getUser();

    if(userError || !user){
        redirect("/login");
    }

    //データベースに保存処理
    const {data:newAddress, error: insertError} = await supabase.from("addresses").insert({
        name: suggestion.placeName,
        address_text: suggestion.address_text,
        latitude: locationData.location.latitude,
        longitude: locationData.location.longitude,
        user_id: user.id,
    }).select("id").single();

    if(insertError) {
        console.error("住所情報を保存に失敗しました。",insertError);
        throw new Error("住所情報を保存に失敗しました。");
    }

    const {error: updateError} = await supabase.from("profiles").update({
        selected_address_id: newAddress.id,
    }).eq("id",user.id);

    if(updateError) {
        console.error("プロフィールの更新に失敗しました。",updateError);
        throw new Error("プロフィールの更新に失敗しました。");
    }

}
export async function selectAddressAction(addressId: number) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        redirect("/login");
    }

    const { error: updateError } = await supabase
        .from("profiles")
        .update({ selected_address_id: addressId })
        .eq("id", user.id);

    if (updateError) {
        console.error("Failed to update selected address.", updateError);
        throw new Error("Failed to update selected address.");
    }
}

export async function deleteAddressAction(addressId: number) {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        redirect("/login");
    }
    //削除処理
    const { error: deleteError } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId)
        .eq("user_id", user.id);

    if (deleteError) {
        console.error("住所の削除に失敗しました。", deleteError);
        throw new Error("住所の削除に失敗しました。");
    }
}
