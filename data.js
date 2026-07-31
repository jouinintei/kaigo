// ============================================================
//  塗り絵の登録リスト
//
//  【追加のしかた】
//  1. できあがった画像を「images」フォルダに入れる
//     (ファイル名は半角英数字がおすすめ。例: budou.png)
//  2. 下のリストに1行コピーして、5つの項目を書きかえる
//     { season: "季節", genre: "ジャンル", title: "お題の名前", diff: "初級/中級/上級", file: "ファイル名" },
//     ※ 季節は「春・夏・秋・冬・通年」のどれか
//       (季節に関係ないものは「通年」と書きます)
//     ※ ジャンルは自由に書けます(例: 花、動物、食べ物、行事、風景、風物詩)
//       同じ言葉で書けば、自動でプルダウンにまとまります
//     ※ 脳トレのページに載せたいときは、行の先頭に kind: "脳トレ", を足します
//       例: { kind: "脳トレ", season: "通年", genre: "ことわざ", title: "...", diff: "初級", file: "..." },
//       (何も書かなければ塗り絵のページに載ります)
//     ※ 答えの画像があるときは、行の最後に answer: "答えのファイル名" を足すと
//       同じカードから答えを見たり保存したりできます
//  3. このファイルを上書き保存して、index.html を開き直すと反映されます
//
//  ※ 行の最後の「,(カンマ)」を忘れずに!
//  ※ 消したいときは、その行ごと削除すればOKです
// ============================================================

window.NURIE_LIST = [

  // ---- 花 ----
  { season: "夏", genre: "花", title: "あじさい", diff: "中級", file: "ajisai_chu.png" },
  { season: "夏", genre: "花", title: "ひまわり", diff: "初級", file: "himawari_sho.png" },
  { season: "夏", genre: "花", title: "ひまわり", diff: "中級", file: "himawari_chu.png" },
  { season: "夏", genre: "花", title: "ひまわり", diff: "上級", file: "himawari_jo.png" },
  { season: "夏", genre: "花", title: "ひまわり畑", diff: "上級", file: "himawari_batake_jo.png" },
  { season: "夏", genre: "花", title: "ほおずき", diff: "中級", file: "hozuki_chu.png" },
  { season: "夏", genre: "花", title: "ゆり", diff: "中級", file: "yuri_chu.png" },
  { season: "夏", genre: "花", title: "アサガオ", diff: "中級", file: "asagao_chu.png" },
  { season: "夏", genre: "花", title: "オシロイバナ", diff: "中級", file: "oshiroibana_chu.png" },
  { season: "夏", genre: "花", title: "クチナシ", diff: "中級", file: "kuchinashi_chu.png" },
  { season: "夏", genre: "花", title: "スイレン", diff: "中級", file: "suiren_chu.png" },
  { season: "夏", genre: "花", title: "ダリア", diff: "中級", file: "dahlia_chu.png" },
  { season: "夏", genre: "花", title: "ノウゼンカズラ", diff: "中級", file: "nouzenkazura_chu.png" },
  { season: "夏", genre: "花", title: "ハイビスカス", diff: "中級", file: "hibiscus_chu.png" },
  { season: "夏", genre: "花", title: "ハナショウブ", diff: "中級", file: "hanashobu_chu.png" },
  { season: "夏", genre: "花", title: "マリーゴールド", diff: "中級", file: "marigold_chu.png" },
  { season: "夏", genre: "花", title: "ラベンダー", diff: "中級", file: "lavender_chu.png" },
  { season: "夏", genre: "花", title: "百日紅", diff: "中級", file: "sarusuberi_chu.png" },
  { season: "夏", genre: "花", title: "蓮", diff: "中級", file: "hasu_chu.png" },

  // ---- 食べ物 ----
  { season: "夏", genre: "食べ物", title: "かき氷", diff: "初級", file: "kakigori_sho.png" },
  { season: "夏", genre: "食べ物", title: "すいか", diff: "初級", file: "suika_sho.png" },
  { season: "夏", genre: "食べ物", title: "夏の果物", diff: "初級", file: "natsu_kudamono_sho.png" },
  { season: "夏", genre: "食べ物", title: "夏野菜", diff: "初級", file: "natsu_yasai_sho.png" },
  { season: "夏", genre: "食べ物", title: "夏野菜", diff: "中級", file: "natsu_yasai_chu.png" },
  { season: "夏", genre: "食べ物", title: "夏野菜", diff: "上級", file: "natsu_yasai_jo.png" },
  { season: "夏", genre: "食べ物", title: "とうもろこし", diff: "初級", file: "toumorokoshi_sho.png" },

  // ---- 風物詩 ----
  { season: "夏", genre: "風物詩", title: "うちわ", diff: "初級", file: "uchiwa_sho.png" },
  { season: "夏", genre: "風物詩", title: "うちわと金魚鉢", diff: "初級", file: "uchiwa_kingyo_sho.png" },
  { season: "夏", genre: "風物詩", title: "すだれ風鈴", diff: "中級", file: "sudare_furin_chu.png" },
  { season: "夏", genre: "風物詩", title: "すだれ風鈴", diff: "上級", file: "sudare_furin_jo.png" },

  // ---- 行事 ----
  { season: "夏", genre: "行事", title: "よーよーつり", diff: "初級", file: "yoyo_tsuri_sho.png" },
  { season: "夏", genre: "行事", title: "よーよーつり", diff: "中級", file: "yoyo_tsuri_chu.png" },
  { season: "夏", genre: "行事", title: "夏まつり", diff: "上級", file: "natsu_matsuri_jo.png" },
  { season: "夏", genre: "行事", title: "夏祭り", diff: "初級", file: "natsu_matsuri_sho.png" },
  { season: "夏", genre: "行事", title: "夏祭り", diff: "中級", file: "natsu_matsuri_chu.png" },
  { season: "夏", genre: "行事", title: "祇園祭", diff: "上級", file: "gion_matsuri_jo.png" },
  { season: "夏", genre: "行事", title: "精霊馬", diff: "初級", file: "shoryo_uma_sho.png" },
  { season: "夏", genre: "行事", title: "精霊馬", diff: "上級", file: "shoryo_uma_jo.png" },
  { season: "夏", genre: "行事", title: "花火", diff: "中級", file: "hanabi_chu.png" },
  { season: "夏", genre: "行事", title: "花火", diff: "上級", file: "hanabi_jo.png" },
  { season: "夏", genre: "行事", title: "金魚すくい", diff: "中級", file: "kingyo_sukui_chu.png" },

  // ---- 風景 ----
  { season: "夏", genre: "風景", title: "夏", diff: "初級", file: "natsu_sho.png" },
  { season: "夏", genre: "風景", title: "夏", diff: "中級", file: "natsu_chu.png" },
  { season: "夏", genre: "風景", title: "夏", diff: "上級", file: "natsu_jo.png" },
  { season: "夏", genre: "風景", title: "夏の海", diff: "中級", file: "natsu_umi_chu.png" },
  { season: "夏", genre: "風景", title: "夏の海", diff: "上級", file: "natsu_umi_jo.png" },

  // ---- 動物 ----
  { season: "夏", genre: "動物", title: "蝉取り", diff: "中級", file: "semitori_chu.png" },

  // ---- 通年・動物 ----
  { season: "通年", genre: "動物", title: "うさぎ", diff: "初級", file: "usagi_sho.png" },
  { season: "通年", genre: "動物", title: "うさぎ", diff: "中級", file: "usagi_chu.png" },
  { season: "通年", genre: "動物", title: "くじら", diff: "中級", file: "kujira_chu.png" },
  { season: "通年", genre: "動物", title: "しば犬", diff: "中級", file: "shibainu_chu.png" },
  { season: "通年", genre: "動物", title: "しば犬と猫", diff: "上級", file: "shibainu_neko_jo.png" },
  { season: "通年", genre: "動物", title: "ふくろう", diff: "中級", file: "fukurou_chu.png" },
  { season: "通年", genre: "動物", title: "アヒル", diff: "初級", file: "ahiru_sho.png" },
  { season: "通年", genre: "動物", title: "インコ", diff: "中級", file: "inko_chu.png" },
  { season: "通年", genre: "動物", title: "サバンナ", diff: "上級", file: "savanna_jo.png" },
  { season: "通年", genre: "動物", title: "ハムスター", diff: "初級", file: "hamster_sho.png" },
  { season: "通年", genre: "動物", title: "動物園", diff: "初級", file: "doubutsuen_sho.png" },
  { season: "通年", genre: "動物", title: "動物園", diff: "上級", file: "doubutsuen_jo.png" },
  { season: "通年", genre: "動物", title: "海の生き物", diff: "初級", file: "umi_ikimono_sho.png" },
  { season: "通年", genre: "動物", title: "海の生き物 その2", diff: "初級", file: "umi_ikimono_sho_2.png" },
  { season: "通年", genre: "動物", title: "熊", diff: "初級", file: "kuma_sho.png" },
  { season: "通年", genre: "動物", title: "犬", diff: "初級", file: "inu_sho.png" },
  { season: "通年", genre: "動物", title: "犬", diff: "中級", file: "inu_chu.png" },
  { season: "通年", genre: "動物", title: "犬と猫", diff: "初級", file: "inu_neko_sho.png" },
  { season: "通年", genre: "動物", title: "犬と猫", diff: "中級", file: "inu_neko_chu.png" },
  { season: "通年", genre: "動物", title: "犬と猫", diff: "上級", file: "inu_neko_jo.png" },
  { season: "通年", genre: "動物", title: "犬種", diff: "初級", file: "inushu_sho.png" },
  { season: "通年", genre: "動物", title: "狼", diff: "初級", file: "ookami_sho.png" },
  { season: "通年", genre: "動物", title: "狼", diff: "上級", file: "ookami_jo.png" },
  { season: "通年", genre: "動物", title: "猫", diff: "初級", file: "neko_sho.png" },
  { season: "通年", genre: "動物", title: "猫", diff: "中級", file: "neko_chu.png" },
  { season: "通年", genre: "動物", title: "猫", diff: "上級", file: "neko_jo.png" },
  { season: "通年", genre: "動物", title: "猫カフェ", diff: "上級", file: "neko_cafe_jo.png" },
  { season: "通年", genre: "動物", title: "羊", diff: "中級", file: "hitsuji_chu.png" },
  { season: "通年", genre: "動物", title: "羊", diff: "上級", file: "hitsuji_jo.png" },
  { season: "通年", genre: "動物", title: "蝶を追いかける猫", diff: "中級", file: "chou_neko_chu.png" },
  { season: "通年", genre: "動物", title: "金魚", diff: "上級", file: "kingyo_jo.png" },
  { season: "通年", genre: "動物", title: "馬", diff: "中級", file: "uma_chu.png" },
  { season: "通年", genre: "動物", title: "馬", diff: "上級", file: "uma_jo.png" },

  // ---- 塗り絵 追加分 ----
  { season: "通年", genre: "動物", title: "庭の猫", diff: "上級", file: "niwa_neko.png" },
  { season: "通年", genre: "風景", title: "田園風景", diff: "上級", file: "denen_fukei.png" },

  // ---- 脳トレ ----
  { kind: "脳トレ", season: "通年", genre: "漢字", title: "難読漢字(魚へん)", diff: "中級", file: "nandoku_kanji_sakana.png", answer: "nandoku_kanji_sakana_kotae.png" },
  { kind: "脳トレ", season: "通年", genre: "言葉遊び", title: "3文字しりとり", diff: "初級", file: "shiritori_3moji.png", answer: "shiritori_3moji_kotae.png" },
  { kind: "脳トレ", season: "通年", genre: "ことわざ", title: "ことわざ絵クイズ その1", diff: "中級", file: "kotowaza_quiz_1.png" },
  { kind: "脳トレ", season: "通年", genre: "ことわざ", title: "ことわざ絵クイズ その2", diff: "中級", file: "kotowaza_quiz_2.png" },

  // ---- カレンダー (kind: "カレンダー" と year: 年, month: 月の数字 を付ける) ----
  { kind: "カレンダー", year: 2026, month: 8, season: "通年", title: "8月カレンダー", file: "calendar_2026_08.png" },
  { kind: "カレンダー", year: 2026, month: 8, season: "通年", title: "8月カレンダー(貼り付け用)", file: "calendar_2026_08_blank.png" },
  { kind: "カレンダー", year: 2026, month: 9, season: "通年", title: "9月カレンダー", file: "calendar_2026_09.png" },
  { kind: "カレンダー", year: 2026, month: 9, season: "通年", title: "9月カレンダー(貼り付け用)", file: "calendar_2026_09_blank.png" },
  { kind: "カレンダー", year: 2026, month: 10, season: "通年", title: "10月カレンダー(貼り付け用)", file: "calendar_2026_10_blank.png" },

  // ▼ ここに新しい行を追加していってください ▼

];
