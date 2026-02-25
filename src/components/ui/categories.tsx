"use client";
import CarouselContainer from "../carousel-container";
import Category from "./category";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export interface CategoryType {
  categoryName: string;
  type: string;
  imageUrl: string;
}

export default function Categories() {
  const categories: CategoryType[] = [
    {
      categoryName: "ファーストフード",
      type: "fast_food_restaurant",
      imageUrl: "/images/categories/ファーストフード.png",
    },
    {
      categoryName: "日本料理",
      type: "japanese_restaurant",
      imageUrl: "/images/categories/日本料理.png",
    },
    {
      categoryName: "ラーメン",
      type: "ramen_restaurant",
      imageUrl: "/images/categories/ラーメン.png",
    },
    {
      categoryName: "寿司",
      type: "sushi_restaurant",
      imageUrl: "/images/categories/寿司.png",
    },
    {
      categoryName: "中華料理",
      type: "chinese_restaurant",
      imageUrl: "/images/categories/中華料理.png",
    },
    {
      categoryName: "カフェ",
      type: "cafe",
      imageUrl: "/images/categories/コーヒー.png",
    },
    {
      categoryName: "イタリアン",
      type: "italian_restaurant",
      imageUrl: "/images/categories/イタリアン.png",
    },
    {
      categoryName: "フレンチ",
      type: "french_restaurant",
      imageUrl: "/images/categories/フレンチ.png",
    },
    {
      categoryName: "ピザ",
      type: "pizza_restaurant",
      imageUrl: "/images/categories/ピザ.png",
    },
    {
      categoryName: "韓国料理",
      type: "korean_restaurant",
      imageUrl: "/images/categories/韓国料理.png",
    },
    {
      categoryName: "インド料理",
      type: "indian_restaurant",
      imageUrl: "/images/categories/インド料理.png",
    },
  ];

  const searchParams = useSearchParams();
  const router = useRouter();
  const currentCategory = searchParams.get("category");

  const searchRestaurantsOfCategory = (category: string) => {
    const params = new URLSearchParams(searchParams);

    if (currentCategory === category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    const query = params.toString();
    router.replace(query ? `/search?${query}` : "/search");
  };

  return (
    <CarouselContainer slideToShow={8}>
      {categories.map((category, index) => (
        <Category
          key={index}
          category={category}
          onClick={searchRestaurantsOfCategory}
          select={currentCategory === category.type}
        />
      ))}
    </CarouselContainer>
  );
}
