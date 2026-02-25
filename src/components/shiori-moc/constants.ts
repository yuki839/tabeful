import { ShioriData, DesignPattern } from './types';

export const INITIAL_DATA: ShioriData = {
  title: "鎌倉・江ノ島 食べ歩き＆絶景旅",
  date: "2024.05.15",
  coverImage: "https://picsum.photos/seed/kamakura/1600/900",
  items: [
    {
      id: '1',
      time: '10:00',
      title: '鎌倉駅 集合',
      description: '小町通りへ向かいます。',
      category: 'transport',
      imageUrl: 'https://picsum.photos/seed/kamakura_st/600/400',
      address: '鎌倉市小町1-1'
    },
    {
      id: '2',
      time: '10:30',
      title: 'ともや 鎌倉小町店',
      description: '名物「大仏さま焼き」は必食！',
      category: 'food',
      imageUrl: 'https://picsum.photos/seed/buddha/600/400',
      priceRange: '¥300~',
      rating: 4.5
    },
    {
      id: '3',
      time: '12:00',
      title: '鶴岡八幡宮',
      description: '参拝して、広い境内を散策。',
      category: 'sightseeing',
      imageUrl: 'https://picsum.photos/seed/hachiman/600/400',
      address: '鎌倉市雪ノ下2-1-31'
    },
    {
      id: '4',
      time: '13:30',
      title: '江ノ電で移動',
      description: '海沿いの景色を楽しみながら江ノ島へ。',
      category: 'transport',
      imageUrl: 'https://picsum.photos/seed/enoden/600/400',
      priceRange: '¥260'
    },
    {
      id: '5',
      time: '14:30',
      title: '江ノ島 しらす問屋 とびっちょ',
      description: '生しらす丼が絶品。整理券を先に取るのがコツ。',
      category: 'food',
      imageUrl: 'https://picsum.photos/seed/shirasu/600/400',
      priceRange: '¥1800',
      rating: 4.7
    },
    {
      id: '6',
      time: '16:00',
      title: '稚児ヶ淵',
      description: '夕日が綺麗な岩場スポット。',
      category: 'sightseeing',
      imageUrl: 'https://picsum.photos/seed/chigo/600/400',
      address: '藤沢市江の島2'
    }
  ]
};

export const PATTERN_INFO: Record<DesignPattern, { name: string; desc: string }> = {
  [DesignPattern.Modern]: { name: "モダン", desc: "シンプルで洗練された雰囲気。" },
  [DesignPattern.Timeline]: { name: "タイムライン", desc: "旅の流れを時系列で表示。" },
  [DesignPattern.MapSplit]: { name: "地図分割", desc: "地図とリストを同時に表示。" },
  [DesignPattern.Magazine]: { name: "雑誌", desc: "ビジュアル重視の編集風。" },
  [DesignPattern.Cards]: { name: "カード", desc: "全体を一覧で俯瞰。" },
  [DesignPattern.Kanban]: { name: "カンバン", desc: "横並びで進行を整理。" }
};
