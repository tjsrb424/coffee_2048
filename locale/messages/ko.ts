/**
 * Korean (ko) — 기본 로케일 메시지 사전.
 * 추후 en/ja/zh는 동일 키(MessageId)를 유지한 채 파일만 추가하면 된다.
 */
export const koMessages = {
  "common.guestDefault": "손님",
  "nav.settings": "설정",
  "nav.shop": "상점",
  "nav.menu": "메뉴",
  "nav.codex": "도감",
  "nav.timeShop": "떠돌이 판매상",
  "lobby.srOnly.todayShop": "오늘의 매장",
  "lobby.onboarding.hint":
    "아래 카드에서 로스터·작업대·계산대·상점을 바로 열 수 있어요.",
  "lobby.onboarding.dismiss": "알겠어요",
  "lobby.cafeFallback.title": "카페(스크롤형 운영)",
  "lobby.cafeFallback.suffix": "에서도 같은 작업을 할 수 있어요.",

  "lobby.sheet.roast.title": "로스터",
  "lobby.sheet.roast.tagline": "베이스를 준비해요",
  "lobby.sheet.roast.description": "원두를 볶아서 샷으로 만드는 곳입니다.",
  "lobby.sheet.roast.body": "원두를 넣고 로스팅을 시작해요.",

  "lobby.sheet.showcase.title": "작업대",
  "lobby.sheet.showcase.tagline": "메뉴를 만들어 진열해요",
  "lobby.sheet.showcase.description": "샷을 이용해 커피를 제작하는 곳입니다.",
  "lobby.sheet.showcase.body": "만들 수 있는 메뉴부터 눌러 재고를 채워요.",

  "lobby.sheet.counter.title": "카운터",
  "lobby.sheet.counter.tagline": "제작한 커피를 판매해요",
  "lobby.sheet.counter.description": "진열 판매할 음료는 쇼케이스에서 제작해주세요",
  "lobby.sheet.counter.body": "",

  "lobby.sheet.puzzle.title": "퍼즐",
  "lobby.sheet.puzzle.tagline": "한 판 시작",
  "lobby.sheet.puzzle.description": "하트 1개로 시작해요.",
  "lobby.sheet.puzzle.body": "원두를 모으러 한 판 들어가요.",

  "lobby.sheet.shop.title": "상점",
  "lobby.sheet.shop.tagline": "재료와 레시피를 준비해요",
  "lobby.sheet.shop.description":
    "코인으로 재료를 사고, 열린 레시피를 담아요.",
  "lobby.sheet.shop.body": "필요한 재료부터 차분히 채워요.",

  "lobby.summary.roast": "베이스 {{shots}}샷 · 원두 {{beans}}단",
  "lobby.summary.showcase.empty": "진열 합계 0잔 · 메뉴 제작으로 채워요",
  "lobby.summary.showcase.idle": "진열 {{stock}}잔 · 판매 대기",
  "lobby.summary.showcase.selling": "진열 {{stock}}잔 · 판매 중",
  "lobby.summary.counter.offline": "직전 오프라인 +{{coins}}코인",
  "lobby.summary.counter.puzzleNone": "아직 퍼즐 기록 없음",
  "lobby.summary.counter.puzzleRecent": "최근 퍼즐 {{score}}점",
  "lobby.summary.counter.stockEmpty": "진열 0잔 · 쇼케이스에서 제작",
  "lobby.summary.counter.stockIdle": "진열 {{stock}}잔 · 판매 개시 전",
  "lobby.summary.counter.stockSelling": "진열 {{stock}}잔 · 판매 중",
  "lobby.summary.puzzle": "하트 {{hearts}} · 베스트 타일 {{bestTile}}",
  "lobby.summary.shop": "보유 코인 {{coins}} · 재료와 레시피 준비",
  "lobby.shopHint.timeShopLabel": "떠돌이 판매상",
  "lobby.shopHint.timeShopReady":
    "{{slot}}엔 떠돌이 판매상에 {{name}} 노트가 나와 있어요.",
  "lobby.shopHint.timeShopNext":
    "다음은 Lv.{{level}}에 {{name}} 노트가 열려요.",
  "lobby.shopHint.timeShopCta": "판매상 보기",

  "lobby.ops.craftHint.craftable": "제작 가능",
  "lobby.ops.craftHint.baseShort": "베이스 부족",
  "lobby.ops.craftHint.resourceShort": "자원 부족",

  "lobby.ops.showcaseStatus.idle": "진열 {{count}}잔 · 판매 대기",
  "lobby.ops.showcaseStatus.selling": "진열 {{count}}잔 · 판매 중",
  "lobby.ops.showcaseStatus.empty": "진열 0잔 · {{hint}}",

  "lobby.ops.offline.withCoinsLead": "직전 오프라인 +",
  "lobby.ops.offline.none": "오늘 기록 없음",

  "lobby.card.label.puzzle": "퍼즐",
  "lobby.card.puzzle.statsBestTile": "베스트 타일 {{bestTile}}",
  "lobby.card.puzzle.desc": "원두를 모으러 한 판 들어가요.",
  "lobby.card.puzzle.cta": "퍼즐 하기",

  "lobby.card.label.roast": "로스터",
  "lobby.card.roast.status": "원두 {{beans}}단 · 베이스 {{shots}}샷",
  "lobby.card.roast.desc": "원두를 샷으로 바꿔 제작 준비를 해요.",
  "lobby.card.roast.cta": "로스터 열기",

  "lobby.card.label.showcase": "쇼케이스",
  "lobby.card.showcase.desc1": "만들 수 있는 메뉴부터 눌러",
  "lobby.card.showcase.desc2": "진열을 채운 뒤 판매를 개시해요.",
  "lobby.card.showcase.cta": "메뉴 제작",
  "lobby.tile.counter.title": "계산대",
  "lobby.tile.shop.title": "상점",

  "lobby.card.label.counter": "카운터",
  "lobby.card.counter.sellingLive.prefix": "판매 중 · 약",
  "lobby.card.counter.selling.unit": "s마다 한 잔",
  "lobby.card.counter.waitStart": "판매 대기 · 쇼케이스에서 개시",
  "lobby.card.counter.emptyLine1": "진열 0잔",
  "lobby.card.counter.emptyLine2": "· 쇼케이스로 복구",
  "lobby.card.counter.cta": "카운터 보기",

  "lobby.card.label.today": "오늘의 운영",
  "lobby.card.today.selling": "판매 진행 중",
  "lobby.card.today.idle": "판매 대기 중",
  "lobby.card.today.empty": "진열이 비어 있어요",
  "lobby.card.today.sellingDesc1": "약 {{sec}}s마다 한 잔씩",
  "lobby.card.today.sellingDesc2": "조용히 나가요.",
  "lobby.card.today.idleDesc1": "진열이 준비되면 쇼케이스에서",
  "lobby.card.today.idleDesc2": "「판매 개시」를 눌러 주세요.",
  "lobby.card.today.emptyDesc1": "쇼케이스에서 한 잔만 만들면",
  "lobby.card.today.emptyDesc2": "진열을 채울 수 있어요.",

  "lobby.counter.empty.title": "진열이 비어 있어요",
  "lobby.counter.empty.body":
    "손님이 가져갈 잔이 없으면 코인이 들어오지 않아요. 쇼케이스에서 메뉴를 먼저 만들어 주세요.",
  "lobby.counter.empty.cta": "쇼케이스에서 메뉴 만들기",
  "lobby.counter.waitSell.body":
    "진열은 준비됐어요. 쇼케이스에서 「판매 개시」를 눌러야 코인이 쌓여요.",
  "lobby.counter.waitSell.cta": "쇼케이스로 이동",

  "menu.page.kicker": "Menu / Showcase",
  "menu.page.title": "쇼케이스",
  "menu.page.intro":
    "진열 잔 수와 단가를 한눈에 볼 수 있어요. 코인은 로비 쇼케이스에서 「판매 개시」 후에 쌓여요. 제작·로스팅은 ",
  "menu.page.introLink": "카페",
  "menu.page.introSuffix": " 탭에서 이어가요.",
  "menu.page.stockHeading": "진열 재고",
  "menu.stock.line": "{{count}}잔 · 판매 +{{price}}코인",

  "menu.drink.americano.name": "아메리카노",
  "menu.drink.americano.description":
    "가볍고 깔끔한 한 잔. 기본으로 가장 잘 나가요.",
  "menu.drink.latte.name": "카페 라떼",
  "menu.drink.latte.description": "부드러운 바디감. 원두를 조금 더 써요.",
  "menu.drink.affogato.name": "아포가토",
  "menu.drink.affogato.description": "진하고 달콤한 마무리. 특별한 한 잔이에요.",

  "cafe.loop.roast.heading": "로스터",
  "cafe.loop.roast.line":
    "원두 {{cost}}단 → 베이스 {{yield}}샷. (최대 {{max}}샷)",
  "cafe.loop.roast.shotsLabel": "베이스",
  "cafe.loop.roast.shotsUnit": "샷",
  "cafe.loop.roast.cta": "로스팅",
  "cafe.loop.roast.ctaLine1": "로스팅",
  "cafe.loop.roast.ctaLine2": "원두 -{{cost}}단 · 샷 +{{yield}}",
  "cafe.loop.roast.hintOk": "원두 {{cost}}개로 샷 {{yield}}개를 만들 수 있습니다.",
  "cafe.loop.roast.blockFull":
    "베이스가 가득 찼어요. 판매로 샷을 비운 뒤 다시 로스팅해요.",
  "cafe.loop.roast.blockBeans": "원두가 {{need}}단 더 필요해요.",

  "cafe.loop.craft.heading": "메뉴 제작",
  "cafe.loop.craft.resources": "지금 자원",
  "cafe.loop.craft.shots": "샷",
  "cafe.loop.craft.beans": "원두",
  "cafe.loop.craft.beansUnit": "단",

  "cafe.loop.display.heading": "진열 · 판매",
  "cafe.loop.display.tickWhenIdle": "",
  "cafe.loop.display.tickWhenSelling": "",
  "cafe.loop.display.startCta": "판매 개시",
  "cafe.loop.display.stopCta": "판매 중지",
  "cafe.loop.display.startHint": "",
  "cafe.loop.display.sellingBadge": "지금은 판매 세션이 켜져 있어요.",
  "cafe.loop.display.emptyTitle.craft": "진열이 비어 있어요",
  "cafe.loop.display.emptyHint.craft":
    "위 메뉴 제작에서 1잔만 만들고, 아래에서 판매를 개시해 주세요.",
  "cafe.loop.display.emptyCta.craft": "메뉴 제작으로 이동",
  "cafe.loop.display.emptyNoCraft":
    "진열이 비어 있어요. 쇼케이스에서 메뉴를 제작해 주세요.",
  "cafe.loop.display.coinLine": "+{{price}}코인",
  "cafe.loop.display.total": "진열 합계",
  "cafe.loop.display.totalUnit": "잔",

  "cafe.menuCraft.badge.can": "제작 가능",
  "cafe.menuCraft.badge.locked": "잠김",
  "cafe.menuCraft.badge.blocked": "제작 불가",
  "cafe.menuCraft.unlock": "카페 Lv.{{level}}에서 열려요",
  "cafe.menuCraft.needShots": "샷이 부족해요 · {{have}}/{{need}}",
  "cafe.menuCraft.needBeans": "원두가 부족해요 · {{have}}/{{need}}단",
  "cafe.menuCraft.blockGeneric": "지금은 만들 수 없어요",
  "cafe.menuCraft.beansPair": "원두 {{have}}/{{need}}단",
  "cafe.menuCraft.stockLabel": "재고",
  "cafe.menuCraft.cta": "제작하기",

  "customer.han_eun.name": "한은",
  "customer.han_eun.intro": "조용한 창가를 좋아하는 단골 후보.",
  "customer.han_eun.story.step1": "창가 자리",
  "customer.han_eun.story.step2": "첫 인사",

  "customer.hyo_im.name": "효임",
  "customer.hyo_im.intro": "달콤한 디저트 메뉴를 즐겨요.",
  "customer.hyo_im.story.step1": "달콤한 취향",
  "customer.hyo_im.story.step2": "작은 선물",

  "customer.seo_jun.name": "서준",
  "customer.seo_jun.intro": "늦은 시간에 들르는 손님.",
  "customer.seo_jun.story.step1": "늦은 저녁",
  "customer.seo_jun.story.step2": "단골의 리듬",

  "customer.so_yeon.name": "소연",
  "customer.so_yeon.intro": "단골이 되어가는 중인 손님.",
  "customer.so_yeon.story.step1": "익숙한 자리",
  "customer.so_yeon.story.step2": "짧은 안부",

  "customer.dong_hyun.name": "동현",
  "customer.dong_hyun.intro": "에스프레소와 달콤한 메뉴를 번갈아 찾아요.",
  "customer.dong_hyun.story.step1": "첫 주문",
  "customer.dong_hyun.story.step2": "취향의 흔적",

  // 일반 손님(방문 손님 풀) — 100명 확장용
  ...(() => {
    const seeds: Array<[string, { name: string; intro: string }]> = [
      ["guest_001", { name: "가온", intro: "따뜻한 라떼를 좋아해요." }],
      ["guest_002", { name: "나래", intro: "가볍게 한 잔 들러요." }],
      ["guest_003", { name: "다온", intro: "오늘은 달콤한 게 끌려요." }],
      ["guest_004", { name: "라온", intro: "에스프레소 향을 좋아해요." }],
      ["guest_005", { name: "마루", intro: "천천히 커피를 골라요." }],
      ["guest_006", { name: "바다", intro: "부드러운 라떼가 좋아요." }],
      ["guest_007", { name: "새봄", intro: "기분 전환하러 들렀어요." }],
      ["guest_008", { name: "서아", intro: "달콤한 한 잔이 필요해요." }],
      ["guest_009", { name: "서윤", intro: "오늘은 진한 커피가 좋아요." }],
      ["guest_010", { name: "시온", intro: "조용히 잠깐 쉬다 가요." }],
      ["guest_011", { name: "아린", intro: "부드러운 거품이 좋아요." }],
      ["guest_012", { name: "아윤", intro: "오늘은 깔끔하게 한 잔." }],
      ["guest_013", { name: "예린", intro: "달콤한 여운이 좋아요." }],
      ["guest_014", { name: "예준", intro: "진한 향을 찾고 있어요." }],
      ["guest_015", { name: "유나", intro: "따뜻하게 데워진 잔이 좋아요." }],
      ["guest_016", { name: "유진", intro: "오늘도 잠깐 들렀어요." }],
      ["guest_017", { name: "윤서", intro: "달콤한 디저트 커피가 좋아요." }],
      ["guest_018", { name: "윤호", intro: "쌉쌀한 맛이 좋아요." }],
      ["guest_019", { name: "은채", intro: "조용히 창가를 봐요." }],
      ["guest_020", { name: "이안", intro: "오늘은 라떼가 끌려요." }],
      ["guest_021", { name: "지안", intro: "한 잔만 빠르게." }],
      ["guest_022", { name: "지유", intro: "달콤한 향을 좋아해요." }],
      ["guest_023", { name: "지후", intro: "진하게 내려요." }],
      ["guest_024", { name: "하린", intro: "부드럽게 마시고 싶어요." }],
      ["guest_025", { name: "하윤", intro: "오늘은 달콤한 게 좋아요." }],
      ["guest_026", { name: "하준", intro: "에스프레소 향을 찾아요." }],
      ["guest_027", { name: "현우", intro: "한 잔으로 충분해요." }],
      ["guest_028", { name: "현서", intro: "따뜻한 라떼가 좋아요." }],
      ["guest_029", { name: "채원", intro: "조용히 쉬다 가요." }],
      ["guest_030", { name: "채윤", intro: "달콤한 한 잔이 좋아요." }],
      ["guest_031", { name: "건우", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_032", { name: "건희", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_033", { name: "경민", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_034", { name: "경수", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_035", { name: "규리", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_036", { name: "규민", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_037", { name: "나은", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_038", { name: "다혜", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_039", { name: "도윤", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_040", { name: "도현", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_041", { name: "라희", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_042", { name: "리나", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_043", { name: "민서", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_044", { name: "민준", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_045", { name: "민채", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_046", { name: "보라", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_047", { name: "서진", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_048", { name: "서현", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_049", { name: "선우", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_050", { name: "세아", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_051", { name: "수민", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_052", { name: "수아", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_053", { name: "수진", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_054", { name: "아라", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_055", { name: "아름", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_056", { name: "연우", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_057", { name: "연서", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_058", { name: "영훈", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_059", { name: "우진", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_060", { name: "유빈", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_061", { name: "은서", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_062", { name: "은우", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_063", { name: "재윤", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_064", { name: "재현", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_065", { name: "정민", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_066", { name: "정우", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_067", { name: "지민", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_068", { name: "지수", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_069", { name: "지훈", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_070", { name: "지현", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_071", { name: "채린", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_072", { name: "채은", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_073", { name: "태윤", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_074", { name: "태현", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_075", { name: "하늘", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_076", { name: "하나", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_077", { name: "해인", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_078", { name: "혜린", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_079", { name: "혜원", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_080", { name: "호준", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_081", { name: "효주", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_082", { name: "효진", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_083", { name: "가람", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_084", { name: "가윤", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_085", { name: "다인", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_086", { name: "도아", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_087", { name: "루나", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_088", { name: "미나", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_089", { name: "민아", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_090", { name: "세은", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_091", { name: "소민", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_092", { name: "소영", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_093", { name: "수빈", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_094", { name: "시윤", intro: "오늘은 한 잔만 챙겨요." }],
      ["guest_095", { name: "아현", intro: "오늘은 한 잔만 챙겨요." }],
    ];

    const entries: Record<string, string> = {};
    for (const [id, v] of seeds) {
      entries[`customer.${id}.name`] = v.name;
      entries[`customer.${id}.intro`] = v.intro;
    }
    return entries;
  })(),

  "hints.todayGuest.line": "오늘의 손님 · {{name}} · 애정 {{shop}}",
  "hints.regular.badge": "단골",
  "hints.counter.title": "오늘의 손님 · {{name}}",
  "hints.counter.sessionGuests": "오늘 들른 손님 · {{guests}}",
  "hints.counter.prefLine": "선호 · {{menus}}",
  "hints.counter.affectionNext":
    "이 손님 애정 {{affection}} · 다음 조각까지 애정 {{remain}}",
  "hints.counter.affectionLineDone":
    "이 손님 애정 {{affection}} · 가게 애정 {{shop}}",
  "hints.counter.shopFoot": "가게 애정 합계 {{shop}}",
  "hints.counter.saleFeed":
    "막 다녀간 손님 · {{names}}",
  "hints.counter.saleAffection":
    "오늘의 손님 · 애정 +{{gained}}",
  "hints.counter.regularGift": "{{name}}이 {{note}}",
  "hints.counter.regularGiftWithTip": "{{name}}이 {{note}} · +{{coins}}코인",
  "hints.counter.storyHeading": "스토리 조각",
  "hints.counter.storyUnlockFeed": "새 메모 · {{title}}",

  "toast.offline.prefix": "오프라인 판매 ",
  "toast.coins.suffix": " 코인",
  "toast.affection.line":
    "오늘의 손님 {{name}} · 애정 +{{gained}}",
  "toast.affection.preferredHint": "선호에 맞춘 잔 · +{{bonus}}",
  "toast.storyFragment.unlocked": "새 메모 · {{title}}",

  "customer.generic.story.step1": "오늘의 기록",
  "customer.generic.story.step2": "작은 기록",

  // 핵심 손님 — 개인화된 흔적 문구(짧고 조용하게)
  "gift.core.han_eun.note1": "창가 쪽에 조용히 두고 갔어요",
  "gift.core.han_eun.note2": "오늘도 같은 자리였으면 해요",
  "gift.core.hyo_im.note1": "따뜻한 마음을 살짝 얹어두고 가요",
  "gift.core.hyo_im.note2": "다음엔 더 달콤한 걸로요",
  "gift.core.seo_jun.note1": "늦은 시간, 덜어낸 숨을 두고 가요",
  "gift.core.seo_jun.note2": "오늘은 여기서 잠깐 쉬어갈게요",
  "gift.core.so_yeon.note1": "고마워요, 짧게 적어둘게요",
  "gift.core.so_yeon.note2": "다음에 또 같은 온도로요",
  "gift.core.dong_hyun.note1": "오늘은 이 정도면 충분했어요",
  "gift.core.dong_hyun.note2": "정리해둔 마음을 두고 가요",

  "lastRun.title": "최근 퍼즐",
  "lastRun.empty": "아직 기록이 없어요. 퍼즐로 첫 온기를 남겨볼까요?",
  "lastRun.score": "점수",
  "lastRun.bestTile": "최고 타일",
  "lastRun.coins": "획득 코인",
  "lastRun.beans": "획득 원두",
  "lastRun.heartsBonus": "하트 보너스 +{{hearts}}",

  "lobby.mainCard.kicker": "오늘의 카페",
  "lobby.mainCard.shopLevel": "Lv.{{level}} 매장",
  "lobby.mainCard.summary":
    "오늘의 매장은 잔잔한 커피향이 감돌아요. 원두 {{beans}}단이 조용히 숙성 중이에요.",
  "lobby.mainCard.cta": "퍼즐 시작",
  "lobby.mainCard.heartsEmpty": "하트가 부족해요. 퍼즐 보상으로 하트를 얻을 수 있어요.",

  "cafeStatus.heading": "오늘의 운영",
  "cafeStatus.intro":
    "원두를 로스팅해 베이스 샷을 만들고, 메뉴를 진열한 뒤 쇼케이스에서 판매를 개시해요.",
  "cafeStatus.sellTickLabel": "판매 간격",
  "cafeStatus.sellWaitLabel": "판매",
  "cafeStatus.sellWaitDetail": "대기",
  "cafeStatus.stat.beans": "원두",
  "cafeStatus.stat.base": "베이스",
  "cafeStatus.stat.display": "진열",
  "cafeStatus.stockLine.withMenu": "지금 진열 중: {{menus}}",
  "cafeStatus.stockLine.empty":
    "진열이 비어 있어요. 쇼케이스에서 잔을 만든 뒤 판매를 개시해 주세요.",
  "cafeStatus.link": "쇼케이스 열기",

  "offlineSales.heading": "오프라인 보상",
  "offlineSales.body":
    "{{time}} 동안 {{sold}}잔이 조용히 나가서 +{{coins}}코인을 챙겨 둘 수 있어요.",
  "offlineSales.note": "오프라인 판매 1차 버전이라 판매 수익 일부만 차분히 정산해요.",
  "offlineSales.ready": "받을 코인",
  "offlineSales.claim": "보상 받기",
  "offlineSales.claimDouble": "광고 보고 2배",
  "offlineSales.claiming": "받는 중...",
  "offlineSales.adClaiming": "광고 확인 중...",
  "offlineSales.doubleNote": "광고 x2는 이번 오프라인 코인 정산에만 1회 적용돼요.",
  "offlineSales.adCancelled":
    "광고 보상을 끝까지 받지 못했어요. 기본 보상은 바로 받을 수 있어요.",
  "offlineSales.adUnavailable":
    "광고를 지금 준비하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
  "offlineSales.adNoFill":
    "지금은 볼 수 있는 광고가 없어요. 기본 보상은 바로 받을 수 있어요.",
  "offlineSales.adUnsupported":
    "이 환경에서는 보상형 광고를 지원하지 않아요. 기본 보상은 바로 받을 수 있어요.",
  "offlineSales.claimed": "이미 정산된 보상이에요.",

  "sellPulse.heading": "카운터 소식",
  "sellPulse.lineOffline":
    "자리를 비운 사이 {{sold}}잔이 나가서 +{{coins}}코인이 들어왔어요.",
  "sellPulse.lineOnline":
    "방금 {{sold}}잔이 나가서 +{{coins}}코인이 들어왔어요.",
  "sellPulse.coinLabel": "코인",

  "a11y.closeSheet": "닫기",
} as const;

export type MessageId = keyof typeof koMessages;
