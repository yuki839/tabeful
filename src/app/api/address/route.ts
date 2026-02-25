import { Address } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try{
        
        let addressList:Address[] = [];
        let selectedAddress:Address | null = null;

        const supabase = await createClient();

        const { data: {user}, error:userError } = await supabase.auth.getUser();

        if (userError ||  !user) {
            return NextResponse.json({error:"ユーザーが認証されていません"},{status:401});
        } 

        //住所情報をテーブルから取得

        const {data: addressData, error:addressError} = await supabase.from("addresses").select("id,name,address_text,latitude,longitude").eq("user_id",user.id);

        if (addressError) {
            console.log("住所情報の取得に失敗しました。",addressError)
            return NextResponse.json({error:"住所情報の取得に失敗しました。"},{status:500});
        }

        addressList = addressData   

        //選択中の住所情報をテーブルから取得
        const {data:selectedAddressData, error:selectedAddressDataError} = await supabase
        .from("profiles")
        .select("selected_address_id")
        .eq("id", user.id)
        .maybeSingle();

        if (selectedAddressDataError) {
            selectedAddress = null;
        } else {
            const selectedId = selectedAddressData?.selected_address_id ?? null;
            selectedAddress = selectedId
                ? addressList.find((address) => address.id === selectedId) ?? null
                : null;
        }

        console.log("addressList",addressList)
        console.log("selectedAddress",selectedAddress)


 
        return NextResponse.json({addressList,selectedAddress});

    }catch(error){
        console.log(error);
        return NextResponse.json({error:"例外的なエラーが発生しました。"})
    }
}


