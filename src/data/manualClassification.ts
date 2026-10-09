/**
 * 2026-10-08 Claude 가 구독 채널 360개를 직접 검토해 정한 분류 (채널 id → 분류함 id, null = 미분류).
 * store 의 persist migrate(version 0 → 1)에서 한 번만 적용된다.
 */
export const ManualClassification: Record<string, string | null> = {
  'UCoTYVg33mido1aPjImeaycw': 'cat-humanities', // 1급 비밀
  'UC_s1FC7s5YVwDImzv-WG93Q': 'cat-ai', // 1분코딩
  'UCJK07Uk2KY9r78ksPoXg-3g': 'cat-ai', // 3Blue1Brown 한국어
  'UCU_HmynNr7OOuPM0P9QXhTw': 'cat-ai', // 3D LUT Creator & Retouch4me
  'UCWKT7DWG0f6976ZB6XANnmQ': 'cat-faith', // 3분의기적
  'UC8J8ZN2Wl6jPsdgCvRmXi4g': 'cat-faith', // 21일간 열방과 함께하는 다니엘기도회
  'UCei9IGoBLCRShZaBb_RN_IA': 'cat-ai', // @시코 - 시니어코딩
  'UCIRh1Bvv_CigcP80H0ZCBUA': 'cat-ai', // [오제이 튜브]OJ Tube
  'UCMYhq9OyGI5UEz_NTAoHY7A': 'cat-politics', // [팟빵] 최욱의 매불쇼
  'UC1OcxsYR_iN98hnoHPGL_Fw': 'cat-muzcebgv-8ujs', // Adam Tuminaro (OrlandoDrummer)
  'UCbBZNHYHOte25t8o2aHZRPg': 'cat-ai', // Adrien Foucart
  'UCmZ19AIj_wcpwRcqG7p9L8g': 'cat-muzcebgv-8ujs', // Again 가요톱10 : KBS KPOP Classic
  'UCX1-PEG_AbMNh8MKkfmKk9Q': 'cat-ai', // AI GENIUS
  'UCu7O7qC9Y11z0gRMsBe9RrA': 'cat-ai', // AI 기술연구소
  'UCvh79XDQNnQRns5XSxWnmvw': 'cat-ai', // AI 아스트라 AI Astra
  'UCw7FrceFhwPLzIPeu-AFM8A': 'cat-ai', // AI 코리아 커뮤니티
  'UCJm4TRJZrgtZ8pwLoXwS_xA': 'cat-ai', // Aidentify co.
  'UCjDmB5Fa3qujgoqXrGzu2-A': 'cat-ai', // AIEUN
  'UCSOYuo3uOG3GCUFIeB4or7A': 'cat-ai', // AISchool
  'UC3DytKu_cLUhHQ8TB38LYyg': 'cat-ai', // AiX
  'UCgYEDLbAcP26PjuOGebu05A': 'cat-ai', // AI는 내 친구
  'UC03x6KCsTmf_vDzSf4Y5miQ': 'cat-ai', // AI와 No-Code 가이드
  'UC3L6PsCEVo-fwHueMEZbaSw': 'cat-muzcebgv-8ujs', // ART GROOVE
  'UCzypbmDj_kVPDW3qWlrEFjA': 'cat-ai', // ART Lab for Beauty AI
  'UCCCykh4SG6waaLTgyRJONXw': null, // atthariq huzaifah
  'UCP4yn_o4o63ys1KLO-adIjw': 'cat-ai', // BARO-TUBE
  'UCcaBEnCcdLBTy7P0-k-IUyg': null, // Bella
  'UCxdsSrHlPvSd24wNvmO4QpQ': 'cat-english', // Best English Online
  'UCtCiMH6QQxGU80r4SczFCRg': 'cat-ai', // BIPA SORI
  'UCgnbG5PBcqiXhWCuosKx6hg': 'cat-english', // BOOKISH ENGLISH
  'UCgp715TVX9u6cab9XCsFtTw': null, // bRd 3D
  'UCT8FUW8bKuNw_l1BS41Wj5Q': 'cat-english', // Brown English (브라운 영어)
  'UCiDgIi0yw3fePTC3uRfqlTA': null, // Bubble Dia
  'UCyfuXve0-iSw1Pbd1HRbDAA': 'cat-english', // Business English Learning
  'UCOfl4ZI1CMiAYFqLdPjFzkA': 'cat-english', // Cake English I 케이크 영어
  'UCAi_uNeDWRXj8C8yw358gWw': 'cat-muzcebgv-8ujs', // CharlesBerthoud
  'UCdrKuOS3tBgI-kwq-QPkGtw': 'cat-muzcebgv-8ujs', // Charlie Parra del Riego
  'UCo8HIr2vN5PzV8yB8ehoiRw': 'cat-ai', // ChiDotPhi
  'UCVdzj_xWNW9vbvcBnxgOu5w': 'cat-ai', // CodingJim
  'UCWYDCQIvJn2oihM7xEYX6jQ': 'cat-muzcebgv-8ujs', // COOP3RDRUMM3R
  'UCYbPbleb4IFkxeZZRnnScvQ': null, // Danny Cho 대니초
  'UCAs99LJynz1DN4hzmRyGbpQ': 'cat-english', // DEP - Daily English Podcast
  'UCC08PqaGWZXdnpxR4Gi2gUg': 'cat-ai', // devCJH
  'UC45UsliByLY_35992Dn72tA': null, // dimsunk
  'UCMm-GOTM_1Y1Z2p5nXXOs0Q': 'cat-muzcebgv-8ujs', // Drummer Subin
  'UCTRHegh7UqWuKRymXoqzbzA': 'cat-english', // Easy English
  'UCl_tB4AqPkkxuYcJQHz6dMw': 'cat-humanities', // EBSCulture (EBS 교양)
  'UCFCtZJTuJhE18k8IXwmXTYQ': 'cat-humanities', // EBSDocumentary (EBS 다큐)
  'UCfhUvwEliU4ANyaqaA8p7YQ': 'cat-english', // English Café
  'UCLsI5-B3rIr27hmKqE8hi4w': 'cat-english', // English Speaking Course
  'UCMbnJ_YNl98WtDvc7x70HMQ': 'cat-english', // English with Altaf
  'UC8butISFwT-Wl7EV0hUK0BQ': 'cat-ai', // freeCodeCamp.org
  'UCxmD4IlfIkKbwnMZ2qO6jaQ': 'cat-muzcebgv-8ujs', // Gitaris Virtual
  'UCi2T8xh5CFTRPkgDe4LMzUA': 'cat-faith', // GOODTV
  'UCpujNlw4SUpgTU5rrDXH0Jw': 'cat-ai', // hanyoseob
  'UC9BQI0NciXSjJvPGQm5Ri8A': 'cat-muzcebgv-8ujs', // Helmsdrums
  'UCPpYqYpE5Hs9qspHDZpJkHg': 'cat-english', // Hi American English
  'UCv6qWqCUlp-_3NfWDqSEnNg': 'cat-ai', // Hoyeon Lee
  'UC2_jy0Y1MUpSlWmjprid9QQ': 'cat-ai', // HS효성인포메이션시스템
  'UCxI59iHPypbdAfoQwZxjkIg': null, // Hyunguk Choi
  'UClkjSmTL-onPWI44KrZYWIg': 'cat-ai', // IB 96
  'UCTivi6Kji_93AjJu-7-osLQ': 'cat-ai', // Idea Factory KAIST
  'UC7BTThk86mtQwuFsrYenjFg': 'cat-faith', // In God [성경 읽어주는 큰아들]
  'UCqfA_mbIEOquBxEYQTQr2qg': null, // Inviz-Corporation
  'UCDZRhDottMytwxcYsoHVLzQ': 'cat-muzcebgv-8ujs', // JensJulius Tejlgaard
  'UCGbvd7P4KTLiEWIW-UHwlCA': null, // jihunback
  'UCdEmqNSAtwKAFkSLNZbqIyQ': 'cat-english', // Jim's Language TV
  'UCSsnbzVL74ci5JBnQ1YRrBw': 'cat-english', // JJD 랭귀지 스쿨 Language School
  'UC508GJLL7Aqj1lVJe0b5bCg': 'cat-ai', // Joonseok Lee
  'UCyLATKbctfN_N6uq0IHvfZg': 'cat-muzcebgv-8ujs', // Josephine Alexandra
  'UCsU-I-vHLiaMfV_ceaYz5rQ': 'cat-politics', // JTBC News
  'UCy8iXLTnNeEDuWxMkCHtCdw': 'cat-ai', // JUSTA
  'UCLUpuCd77AlrZDT7nYQ1BEg': null, // KFO하이테커
  'UC4zNtKX3XTplYQWNFPorvXQ': 'cat-travel', // Kirin Camp
  'UC1ifSsWUG241rRfK0ezYCgA': 'cat-politics', // KNN NEWS
  'UCXtMjo8xJqjEhS4A9KUY8GA': 'cat-english', // Learn English with Jessica
  'UCFTqEunpCvGn4EP021KTqRw': 'cat-english', // LearningEnglishPRO
  'UC8-dJr7bnbefd7dZdbNRgWQ': 'cat-ai', // LG디스플레이 대학생 인플루언서_디플
  'UCkVryTZ51DxlGyD6s-aJr_Q': null, // Logical 로지컬
  'UCkrQEnDSQYPEGL8N5QXAjcw': 'cat-faith', // Logos Global Academy
  'UC2L7vR43LKuBXXV2AentEMw': 'cat-english', // Luke's English Podcast
  'UCaSMwmZTO2W_BiM5r3IG7Ug': null, // Lumapic
  'UCM6kW7YE-Rzo2pp3R4ESgqg': 'cat-english', // M. School
  'UC6Zjgg_0PQBm96aHeiXrjXQ': 'cat-ai', // MATLAB Korea
  'UC_MhiKg09wY1rplbmV7yhEg': 'cat-muzcebgv-8ujs', // Mauricio Murúa
  'UCTTmtS2ljy1vyl_s-d_LEHQ': 'cat-politics', // MBC 라디오 시사
  'UCF4Wxdo3inmxP-Y59wXDsFw': 'cat-politics', // MBCNEWS
  'UCxP77kNgVfiiG6CXZ5WMuAQ': 'cat-ai', // Minsuk Heo 허민석
  'UCbnp0LPbnpzGkPusF335YEA': 'cat-muzcebgv-8ujs', // Music Collection
  'UCNrehnUq7Il-J7HQxrzp7CA': 'cat-ai', // NAVER D2
  'UCkN6oIPrS-ovf5AU9BD7KCg': 'cat-muzcebgv-8ujs', // OGAM Entertainment
  'UCorMupI2YQa4KPhXLjAA4yw': null, // Park Jong Hyun박종현
  'UCuQhEfqqWYWXZ3MUG6WsBng': 'cat-politics', // Peachy 피치
  'UCDg1jUw5sz4JB0G_4cJmNAg': 'cat-ai', // PIEW 9
  'UC5sXmvSmYT59HLurpL831pg': 'cat-english', // Podcast Speak English
  'UCDq7SjbgRKty5TgGafW8Clg': 'cat-ai', // Prompt Engineering
  'UCvn_XCl_mgQmt3sD753zdJA': 'cat-english', // Rachel's English
  'UCK8XIGR5kRidIw2fWqwyHRA': 'cat-ai', // Reducible
  'UCOjSAnCNn_6z2Rc-v6vU8rg': 'cat-ai', // Samdo Coding
  'UCfnO1Z4p_mgfTeknJDj1SYw': null, // Sangsoo Kim
  'UC3_tJVnWvyjEnRDL7g2zMqw': 'cat-muzcebgv-8ujs', // Saree McIntosh - 새리
  'UC2ZBhOYd8jrpMPFkMpFDOlg': null, // SIMP
  'UCD5i6ELexwaq8fRDoI4q55w': 'cat-english', // Simple Spoken English
  'UCtV98yyffjUORQRGTuLHomw': 'cat-ai', // SKplanet Tacademy
  'UCxTO0Vl-HDhO277iWA7DK_w': 'cat-ai', // Smart Design Lab @ KAIST
  'UCkev7dgNDOOvBChm9oJFsnw': 'cat-humanities', // So, 에스텔!
  'UC7ejdqHMbj1oYBh3MhbAmyQ': 'cat-muzcebgv-8ujs', // SOSOHAN CLASSIC 김윤경의 소소한 클래식
  'UCbSpMDJ3X656Q3Sipoeqvmg': 'cat-english', // Speak English With Class
  'UCHLD2M7FVtTSara7D_vAxUg': 'cat-english', // SpeakEasy English Pod
  'UCML9R2ol-l0Ab9OXoNnr7Lw': 'cat-ai', // Sung Kim
  'UCQKuJnMf7rhHQk_iZmph7_g': 'cat-english', // Talk English with pod
  'UC0uDM1xZMNBAoW2xnzhAQ7g': 'cat-ai', // Teccboi Wonie
  'UCDku86cssbM288VJtl-GQKg': 'cat-ai', // Terry TaeWoong Um
  'UCvlfCpmecGhPDDLPj3ktDUA': 'cat-faith', // The AI Bible
  'UCyzDS-GWXDOKxg24cGDNxtQ': 'cat-ai', // TMook
  'UC_VOQjI7mtQTEaTXXQIzLtQ': 'cat-ai', // TTABAE-LEARN
  'UC78PMQprrZTbU0IlMDsYZPw': null, // tvN Joy
  'UCbfYPyITQ-7l4upoX8nvctg': 'cat-ai', // Two Minute Papers
  'UCQS2kZx_Rxxc3w5QK01SVIA': 'cat-english', // WooEnglish - learn english through story
  'UC7P1LE5PZY9fMwAifTgbEyQ': 'cat-english', // Yes, I Can! 영어
  'UChlgI3UHCOnwUGzWzbJ3H5w': 'cat-politics', // YTN
  'UCueLU1pCvFlM8Y8sth7a6RQ': 'cat-ai', // ‍김성범[ 교수 / 산업경영공학부 ]
  'UCvy2_bLOcUvb1Ng4GbciYfA': 'cat-ai', // ‍유이경[ 대학원석사과정졸업 / 산업경영공학과 ]
  'UCVWVcnwckkpF1u81IX6yoGg': null, // 감동뉴스
  'UCPP1HVcKyFThWlpO-JJdXdg': 'cat-ai', // 감자나라ai
  'UCLbOYoltlCD0LN06fSwKTsQ': 'cat-faith', // 갓피플TV
  'UCUzNisbXE-YeXvdWaA-jXkQ': null, // 경제인회계인
  'UCHXvjavEtkPFJCfGlm0wTXw': 'cat-politics', // 경향TV
  'UCw_N-Q_eYJo-IJFbNkhiYDA': 'cat-ai', // 골드메탈
  'UClv7tO9Bkb9PAHXk5TN4jIA': null, // 공부 완죤좸
  'UCUQi7y46_TMbvPjSt1AbDug': 'cat-ai', // 공부하는 개발자
  'UCmgRYMK5d65PbjN8qkjAUBA': 'cat-ai', // 과학쿠키 [Science Cookie]
  'UCXG8hH02Em6_6pF38THOlSg': null, // 광장
  'UCxKTingNVwDKnNiLW4fW_YQ': 'cat-faith', // 교회교육연구소
  'UC7k5xDVLrRNQMrdlNHx8IQQ': 'cat-english', // 구슬쌤
  'UChs4QVmWmbWQfsbQESF0MYw': 'cat-travel', // 구어세:구글어스로 세상보기
  'UC7_VkIW7nhIurDTfy-lWPDg': 'cat-history', // 궁금소
  'UC92mquxLQrkvUapmEb9pT3w': 'cat-english', // 귀뚜라미 영어
  'UCB2hdTOOADoetjR3RRDpvVQ': 'cat-english', // 글로리아영어
  'UC_SgaM1zbb1Mibnsp6J0fJA': null, // 기묘한 밤
  'UChLHvrqxYRGFdHCVEReD0GQ': 'cat-ai', // 기묘한 자동화
  'UC1AAhUdk05gUW9uDvmgkpJQ': 'cat-faith', // 길치목사
  'UCq4Pv2ZCMEWNCLMD6jRTitA': null, // 김규리tv 몹시
  'UCKpuKGBnoUbnp4o35IE5vFA': 'cat-politics', // 김규현 변호사 | 정의규현TV
  'UCKHFkr2bmczSUr8fLlidEXQ': null, // 김영득
  'UC0h8NzL2vllvp3PjdoYSK4g': 'cat-ai', // 김왼손의 왼손코딩
  'UCHo_omMXY8-zL2PUyieehBQ': 'cat-politics', // 김용남의 용방불패tv
  'UCljnbFCt-4doBr7wtEIIbbw': 'cat-politics', // 김용민TV
  'UC_PF96pvb7kxCjbzj6D94YQ': 'cat-ai', // 김웅곤TV
  'UCXql5C57vS4ogUt6CPEWWHA': 'cat-humanities', // 김지윤의 지식Play
  'UCoLmMLvQFm5o3aWl-XR8LTQ': null, // 김진휘
  'UCCqlamsxAie4D0Nbz3TnqFQ': 'cat-ai', // 김학성 (학선생)
  'UCUdyx4YZ_bkBmBS3aq_7Xag': 'cat-ai', // 꽃부리와 코딩여행
  'UCxgeEPgtd5Aw7HgoEUXCauA': 'cat-travel', // 꾸준 kkujun
  'UC01g9oR61Kfme-Udz9T4Lqg': 'cat-english', // 나눔의 가치, 나가치토익
  'UC7iAOLiALt2rtMVAWWl4pnw': 'cat-ai', // 나도코딩
  'UClk5RL8UbzTKHfSYln7d2TQ': 'cat-english', // 날로먹는 영어
  'UC1IsspG2U_SYK8tZoRsyvfg': 'cat-ai', // 남궁성의 정석코딩
  'UCCgMUqWfLg3plThNaIemW8Q': null, // 너와 나의 은퇴학교
  'UCdGTtaI-ERLjzZNLuBj3X6A': 'cat-ai', // 널널한 개발자 TV
  'UCUpJs89fSBXNolQGOYKn0YQ': 'cat-ai', // 노마드 코더 Nomad Coders
  'UCqqd_gFQwf3akS0h4-9BxFA': 'cat-ai', // 노마드AI (Nomad AI)
  'UCfCOEG2kjX_x4KAdWX-YUcA': null, // 노마드션 No mad Shaun
  'UCQeNtDQjRpjZlbCraz09wfg': 'cat-humanities', // 다산월드TV
  'UCXKXULkq--aSgzScYeLYJog': null, // 단테랩스
  'UCBM86JVoHLqg9irpR2XKvGw': null, // 달란트투자
  'UCr_iw9ML1I1ku2cW9-8gZfA': 'cat-english', // 달변가영쌤
  'UCsQ04jYF1mxuzVlMVVPR62Q': 'cat-faith', // 더메시지랩The Message LAB
  'UC4Hcsx9wNY9wEb08cd6ktsQ': 'cat-ai', // 도움코드 쉬운예 DoumCode 데이터홍교수
  'UCPFMNy_S-9oM8P5o1qH2f_g': null, // 동국대 융합교육원
  'UChflhu32f5EUHlY7_SetNWw': 'cat-ai', // 동빈나
  'UChhFoo4M-ZSqDlEPRFRXDkQ': 'cat-english', // 드라마틱 우기
  'UC_4u-bXaba7yrRz_6x6kb_w': 'cat-ai', // 드림코딩
  'UC4qpbPb4FbwYAGhBwXm4MXw': null, // 듣기월드
  'UCWYzc_p0GgfCepIWDHGFmEg': null, // 디글 :Diggle
  'UCt9jbjxLBawaSaEsGB87D6g': 'cat-ai', // 딥러닝호형 DL bro
  'UClO79Cpq72VI63MwGi6VoQw': 'cat-ai', // 라즈이노
  'UCsHx9VNqkfTFzka2vbIBI5w': 'cat-english', // 랠리영어 RallyEnglish
  'UCLP2jMz-MpVgsGizdjfQDZA': 'cat-ai', // 런빌드
  'UCrBpV_pG2kyMMEHCMTNzjAQ': 'cat-ai', // 리뷰엉이: Owl's Review
  'UCpek2YxX2YFfw6WAijw3CqQ': 'cat-faith', // 말씀노트
  'UCSIsVRwCR9dbUXS7KUXX8JQ': 'cat-ai', // 맹윤호TV
  'UChu25pJgVZB3p0dVEgmU0PQ': 'cat-ai', // 메타코드M
  'UCc83YD4u0cZGUhuonuErC_A': 'cat-muzcebgv-8ujs', // 메탈리스트
  'UCP7VFsrE5nztR238DGoEt_g': 'cat-ai', // 모바일랩
  'UCY0gKpXFzg_Db399xEv0Ojw': 'cat-humanities', // 무빙워터
  'UC555mqPVCqpsYkTiUxBROSw': null, // 미니멀 수학
  'UCa87Aji_nbRg9Bz2kcYMfnQ': null, // 미니멀하우스 Minimal House
  'UCSu1uMiwFCBYmEPxdojjnNQ': 'cat-ai', // 미라온
  'UCoQD2xsqwzJA93PTIYERokg': 'cat-politics', // 민주당티비 [더불어민주당]
  'UCFBfY1hHGla-FpqQfp1KKEg': 'cat-travel', // 민짱테레비 [MinzzangTV]
  'UCtXUm3ABtdm_oK2LZ-Xcnhw': 'cat-ai', // 민티저
  'UCnCdjk03MDrQXKiXeA_vUQg': 'cat-humanities', // 민팍의 마음너머
  'UC58J6ELs2a5ro-riw3C13og': 'cat-history', // 밀덕군
  'UC-2RKtsC_66v7xqRQOGLohw': 'cat-ai', // 바이브랩스
  'UC93gi1C2rJ3D0skGh5A856A': 'cat-faith', // 바이블프로젝트 BibleProject - Korean
  'UC4Aa3OPkMenwTANpf0oWVRQ': 'cat-politics', // 박성태의 뉴스쇼
  'UCubzmHb0bcOtWzL4mu3-e6g': 'cat-ai', // 박해선
  'UCld4mHGkLKSrAZOxeDP7pGg': 'cat-ai', // 반도체TV
  'UCGrMG52egZF3j0CUv9c5FUA': 'cat-faith', // 베이직교회
  'UCoCvTlU0KpNYwnMIgs7MPrA': 'cat-humanities', // 보다 BODA
  'UCpZUM8lQBdgzo3avQqtmQvw': 'cat-humanities', // 북툰
  'UCDNh8PrM733odbS38cQLslQ': null, // 분석장인
  'UCWXzqxwWMaKA2KfriK3CB2w': 'cat-faith', // 빛의길TV
  'UC9PB9nKYqKEx_N3KM-JVTpg': 'cat-ai', // 빵형의 개발도상국
  'UC1K_AGcq5w43ZzX_ZhgX-uA': 'cat-politics', // 뺏지형
  'UCJS9VvReVkplPwCIbxnbsjQ': 'cat-politics', // 사람사는세상노무현재단 RohMoohyunFoundation
  'UC-9RQCJ0gS_Kgt7J0SVrE8w': 'cat-humanities', // 사피엔스 스튜디오
  'UChlv4GSd7OQl3js-jkLOnFA': null, // 삼프로TV 3PROTV
  'UCxZRFtsXhBlEsz9kSvNWaAQ': 'cat-ai', // 샘 호트만 : AI 엔지니어의 시선
  'UCvc8kv-i5fvFTJBFAk6n1SA': 'cat-ai', // 생활코딩
  'UCVNAlg66t3JhkzT5JntclLg': 'cat-history', // 샤를의 군사연구소
  'UCwNVDlUgdBlmVWRPy4Nk0Dw': null, // 샾잉 #ing
  'UC7Pw-uwWdZWo7Ka-3WeiNqw': 'cat-faith', // 성경 이야기 탐구
  'UCOBV3sxGVoBTVAeS3z3CKSw': 'cat-faith', // 성경적 동기
  'UC-SyuGFlZXpGdR7WszgYBhw': 'cat-ai', // 성공지식백과
  'UCJoRC-1f2k_U53KXyFhDFbg': 'cat-politics', // 세상 읽어주는남자
  'UC8tJM0XF53xTSWXeMLCUoeg': null, // 세상경사
  'UCqurWMRtF5CkzYlpDj0kuOQ': 'cat-ai', // 센텀디지털캠프평생교육원
  'UCRK_M8zKoxiMMmRcnt_Eb9g': 'cat-english', // 션 파블로 Sean Pablo
  'UC7uDyFIqExDnfXAIZqumFrQ': 'cat-humanities', // 셜록현준
  'UCC3yfxS5qC6PCwDzetUuEWg': null, // 소수몽키
  'UC86HxrAQ4GS1Iq8LIvUYigQ': 'cat-ai', // 소스놀이터
  'UCi3E6YLfTdfHodg6K5dBidw': null, // 송미경
  'UCxQ6xsoXqeVqrDvm71rByQQ': 'cat-travel', // 수길따라(sugilway)
  'UCubIpLB7cA9tWIUZ26WFKPg': 'cat-ai', // 스마트인재개발원
  'UChFf1JrHBdsy3LS3m9cX89Q': 'cat-travel', // 시도 sido
  'UCvTVjsBAYfPUXADRwQ_3Fsg': 'cat-ai', // 시민 데이터 사이언티스트
  'UCeAXe6GG5WicWdoQK6zuojw': 'cat-politics', // 시사와 궁금한 이야기
  'UC_oV9bHBSEu17KMcK-9S0bg': null, // 시애틀줄리
  'UCXnhlnaCAwomtRNCxvXT9PA': null, // 시원스쿨랩
  'UCPuDvuUhgQffuLn8sYxIEqQ': 'cat-ai', // 신박과학
  'UCaJdckl6MBdDPDf75Ec_bJA': null, // 신사임당
  'UC78duXU2wQzD9ktmnYNc4Pg': 'cat-politics', // 신인규의 시대정신
  'UCYYxayhOPmXVCXjnMgUt3iQ': 'cat-ai', // 실용주의 개발
  'UCIE7j27J9OUnFDdId3Sh11Q': 'cat-ai', // 쌩초 컴퓨터실
  'UCyjiqn9No1prLHIcTUA0ZzA': 'cat-history', // 쏨작가의지식사전
  'UCVObSp4MlJwCsh6vtKz4PHQ': 'cat-humanities', // 쓸모왕
  'UCeN2YeJcBCRJoXgzF_OU3qw': 'cat-ai', // 안될공학 - IT 테크 신기술
  'UCtBHTULQbAEg5QbkcZc_Tdw': 'cat-ai', // 안리얼
  'UCNJ0idYZbJKUuhEvUbcYGkg': null, // 앙트레타임스
  'UC28Fzg6zxsaz8SHul9fukUw': 'cat-english', // 야나두 영어회화
  'UC2nkWbaJt1KQDi2r2XclzTQ': 'cat-ai', // 얄팍한 코딩사전
  'UCKdKdx5-eLZUmAgsdvxkKiA': 'cat-ai', // 양실장의 바이브코딩대학
  'UCSPMRoAphbObUYeDaX367Fg': 'cat-ai', // 에스오디 SOD
  'UC0Wy2BjhsQP3gk2iuksCudw': 'cat-english', // 에스텔잉글리쉬EstellEnglish
  'UClTkYrcqEdDlGpzAyEHjnzw': 'cat-ai', // 엔자이너TV
  'UC1PL6DtuE0HWh2y_Lyttptw': 'cat-ai', // 엘세븐시큐리티 ImageOCR
  'UCnnqB7SaH8o-NHLonSFfE3A': null, // 여의도 정보맨
  'UCYIHDeG1tLCuO9rMNVHubJg': 'cat-travel', // 여행자메이 [Traveler May]
  'UCv3aqvZYZM6FUMLqhMO9l6Q': 'cat-english', // 영어 키위새
  'UCDwocU-T3PPaB075K_PbUHA': 'cat-english', // 영어말하기-Speak English
  'UCXZpbm4kHj7yQdZZXA6XxGw': 'cat-english', // 영어인풋
  'UCLR3sD0KB_dWpvcsrLP0aUg': 'cat-ai', // 오늘코드todaycode
  'UClAfLVQYZSLrMAQQ_SXPVZw': 'cat-politics', // 오마이TV
  'UCZ6UHYBQFBe14WUgxlgmYfg': 'cat-ai', // 오빠두엑셀 l 엑셀 강의 대표채널
  'UCz9n4yRsYYryRjrSCK0-YWA': 'cat-ai', // 오준석의 생존코딩
  'UCQF_FKMjBGgudkn20Gp8GEA': 'cat-english', // 올댓비즈 AllThatBiz
  'UCmxYkFMhIJHkrwHrSfIByTA': 'cat-faith', // 요단교회- 광주광역시
  'UCmHof0uMcf-KZOZfxmbRrOw': null, // 우주아저씨
  'UCthQiRfWND58DRzU65RwTtA': 'cat-faith', // 워십빌더스
  'UCZWvx1PFmcTLiGJX3FTcCBA': 'cat-ai', // 웍스AI
  'UCqHDhn1PWmOcJZogXE9vogA': 'cat-ai', // 위디엑스
  'UCT8l_qvhkgTBu8-7wz1hZ0Q': null, // 위라클 WERACLE
  'UCxe2O9XssrQaMV1u8TqFmAw': 'cat-english', // 유쾌한 써니쌤 Sunny Sam
  'UCX3qkfIDXuFAgaOuwp0me4w': 'cat-faith', // 유튜브바이블스쿨
  'UCb7cR-uuENjlyG2a4Uxiudw': 'cat-muzcebgv-8ujs', // 윤기쌤의 통기타 애드립강좌
  'UCZBCyq3cjSnDH5_t9duSCQg': 'cat-english', // 은하수업, 은하쌤의 친절한 영어
  'UCEuh7pMi1-jZa4QTLH4k9eg': 'cat-history', // 이다지do
  'UCFfALXX0DOx7zv6VeR5U_Bg': 'cat-ai', // 이수안컴퓨터연구소
  'UC1u8CrhFa4eHTLgyv3LkE1Q': 'cat-history', // 이익주는 역사
  'UC-6FxcmnbyVeZaYc025I_xQ': 'cat-ai', // 이지쌤
  'UCEd9XXPB-qwNjZu6mc7Ihjg': 'cat-ai', // 인공지능 개발자 모임
  'UCufMvGtKg2hoTs0h1Ti5cxg': 'cat-ai', // 인공지능수학 깨봉
  'UCJgSTH8ksptyNucZVyMWapw': 'cat-humanities', // 인문학이랑
  'UC0LGfuBiVmPZLo5pUW0bshA': 'cat-humanities', // 일당백 : 일생동안 읽어야 할 백권의 책
  'UCmhh3amA_hSt0hj4RHd14Dw': 'cat-ai', // 임팩티브AI [AI Prediction Solution]
  'UCNCU3xShmwkWrZ78NljFwtQ': 'cat-english', // 잉글리쉬튜브 구동사
  'UCe0eVduZh8w3sHJIM7wJkeA': 'cat-ai', // 자연어TV
  'UCZn-Gc4mzqSuc70BYo_W9kA': 'cat-humanities', // 작심만일 : 성공 마인드 동반자
  'UCRv5biV9lv-yImBR3tj0dIA': 'cat-faith', // 잘잘법 :잘 믿고 잘 사는 법
  'UCsqWTNmoaNPvsfeCgaD7BpQ': 'cat-politics', // 장르만 여의도
  'UCAVVxLmPDFkSTROPue8ZrRA': 'cat-politics', // 장윤선의 취재편의점
  'UC602PUDJWt8AKCx3CFjJtTA': 'cat-travel', // 재호캉스
  'UC8X4a1jredRdGcKMZ19zl0w': 'cat-history', // 저스티스
  'UC9a0BE4Txo1u_nKDa1nmXMA': 'cat-politics', // 정치오락실
  'UCadhrKFHh_9K62ETq18EAAQ': 'cat-english', // 제니리 영어 Jenny Lee
  'UC4GnvNKtuJ4cqWsYjxNxAEQ': 'cat-ai', // 제주코딩베이스캠프
  'UCM9Rx3EqBJ-jMhD2E8Gjb4g': null, // 조나단
  'UCQNE2JmbasNYbjGAcuBiRRg': 'cat-ai', // 조코딩 JoCoding
  'UCOcPzXDWSrnaKXse9XOPiog': 'cat-ai', // 주니온TV 아무거나연구소
  'UCokUZClKh1ZK0TjJgxVK5-g': 'cat-english', // 주아쌤_소리튠영어
  'UCxV6HwAqpzkAN1J2s9LolgQ': 'cat-politics', // 중국어로 [路]
  'UCezt_gfn8nJyFltdQUvFM0g': 'cat-english', // 지름길영어 - 영어가 늦었을 땐 빠른 길로
  'UCzLEg_ekrLbKa-HZS85qy_A': 'cat-humanities', // 지성의숲 : 성필원 작가
  'UCcYk_KPZZMLv_bcaSAWSSxA': 'cat-humanities', // 지식 브런치
  'UC0ndikoODFVXZ-uB-wjdwRA': 'cat-humanities', // 지식 읽어주는 남자
  'UC1Do3xw9OuUk7FQuPTmSVOw': 'cat-ai', // 지식보관소
  'UCQKZQFd7AfgHOYoui6OE9Ew': 'cat-humanities', // 지식은 날리지 [Jisik is Knowledge]
  'UCKaEKEiswhc9gYL-cwrC49w': 'cat-humanities', // 지식의 취향
  'UCA_hgsFzmynpv1zkvA5A7jA': 'cat-humanities', // 지식인사이드
  'UCMoPdO2QFYy4uB0FUhCXATQ': 'cat-humanities', // 지식줌
  'UCi9Sl8GnFdYoqEVXnojBPJw': 'cat-humanities', // 지식한입
  'UCAu1wEbjya6hvSv4yfgWybQ': 'cat-history', // 지식한잔
  'UC9cCBxBAQW2CzLYeT20q49A': 'cat-humanities', // 지식해적단
  'UCFGhfIFR9rkVanAY_FyeodQ': null, // 지예림
  'UCSOHILgoHf7ofALgHck3ARw': null, // 집콕생활
  'UCzKoA2mrsU1OhOP0JJ8BVrg': 'cat-faith', // 채널아브라함
  'UCP2DzxpOoyep8S-xozGaPXQ': 'cat-humanities', // 책갈피
  'UCgUaqrLRGLL-dHislR1e2TA': 'cat-humanities', // 책과삶
  'UCOock_9qHke843-hGjnVYHQ': 'cat-humanities', // 책그림
  'UCkLGsCYGPsfZ0GH69k_CO2A': 'cat-ai', // 초간단 자바
  'UC-5Jyf13bHKGGDp2iApfDEw': 'cat-ai', // 초보코딩
  'UCyI7lNkE2DrHHrCwYtPZXFQ': 'cat-ai', // 충남대 소프트웨어중심대학사업단
  'UCSXYdoLwkNPgNAgEt2_wgzw': 'cat-ai', // 친절한 AI
  'UCbajejH7QkG6RTrZ6nyLe_g': 'cat-ai', // 카오스 사이언스
  'UCfBvs0ZJdTA43NQrnI9imGA': 'cat-ai', // 코딩알려주는누나
  'UCxft4RZ8lrK_BdPNz8NOP7Q': 'cat-ai', // 코딩앙마
  'UCSLrpBAzr-ROVGHQ5EmxnUg': 'cat-ai', // 코딩애플
  'UCWVOKMMEJJs9GZULTwVuM0Q': 'cat-ai', // 코딩엑스AI
  'UCO7g158NWgLyn98z8v3zduA': 'cat-ai', // 코딩하는거니
  'UCNdk6BMd8bTtCpngkBxA4ow': 'cat-ai', // 코딩하는초롱
  'UChLDB7HQToJ9EGllIex555w': null, // 콘텐츠위드 | Contents with
  'UCjn-VbcIkAeXQKCmLJV8YwQ': null, // 쿠팡플레이 Coupang Play
  'UCWhzisyjpmNSn2hOJgcfWtg': 'cat-faith', // 크리스찬 하임
  'UCqosjJpIWxVrUBHNIcVJY-A': 'cat-english', // 클라스가다르다
  'UCZ7nsIsZBLtWsj0cFYLKjnA': 'cat-english', // 키위엔 영어
  'UCSnghwknYf04dRFBtOtY8xA': 'cat-politics', // 탐사기획 스트레이트
  'UCcZvGFhtP5GsGg1ecUaCDAw': 'cat-ai', // 텐초
  'UCIIxE0wO6-BFt1H_bi8KqtQ': 'cat-ai', // 토크아이티(Talk IT)
  'UCs7pXreQXz30-ENLsnorqdA': 'cat-ai', // 퇴근후딴짓
  'UCelFN6fJ6OY6v8pbc_SLiXA': 'cat-ai', // 티타임즈TV
  'UCh-c-LFH9Q6VbHRRqD4oLOA': 'cat-ai', // 판다스 스튜디오
  'UCghYTQJZzJEqThwhjoPSF3Q': 'cat-english', // 패턴영어tv
  'UCnlLAaZq-pujakEDBAN1L7Q': 'cat-humanities', // 펀토피아
  'UCowbfOj8HKvTeL6KGIt2waw': 'cat-ai', // 페이퍼로지
  'UCmwspFbQlWYlUrHHMyWXAhw': 'cat-english', // 폼나는 영어
  'UC6FGz4_afkEtH11lTIQqF-A': null, // 퓨처플로우
  'UCdNSo3yB5-FRTFGbUNKNnwQ': 'cat-ai', // 프로그래머 김플 스튜디오
  'UCn9oaGNfb_jvaZbe2VKDCtA': 'cat-humanities', // 프리렉
  'UCKXP5U8mn3UMC6gWblROxAA': 'cat-ai', // 필로소피 AI 교육
  'UC1qHJxdQi6HasIViumMnMJw': null, // 핍핍TV
  'UC1XlulUc0fuZOKYwKFnEO4g': 'cat-english', // 하루영어회화
  'UC2tIYaNpx0ULjpHpInfV6Cg': 'cat-english', // 하우위 X 한가인
  'UC-No96a6faP-GeanQYvRVpg': 'cat-english', // 하우위 잉글리쉬
  'UC84GVMTZO0jmiRmJtnq2CTw': 'cat-ai', // 한경훈
  'UCR6U9pA34FnoutcbcfsWe2g': 'cat-ai', // 한국뇌연구원KBRI
  'UCCoLs5iMq5W24Mihda6OPug': 'cat-ai', // 한국딥러닝
  'UC3vxc_BkV9VcPfuvt-KccGg': null, // 한국사장학교 TV
  'UCNwZiwmMMljfmPOj78HOd5g': 'cat-ai', // 한국인공지능아카데미
  'UC1aS5CRRDrN6CmR2VcpmetA': 'cat-politics', // 한국일보(hankookilbo.com)
  'UCfdwCAK9QHC7XMyKbgmqnjg': null, // 한두자니S2
  'UCpykxJV6dhtesei8JlIS4Sw': null, // 해찰하는 다락방
  'UCmjwMlVeo5DoH8xCmMQlVgA': 'cat-english', // 해커스톡 기초영어회화 공식 유튜브
  'UCkW5ByrBFTf-lVVmF_bZfKg': 'cat-english', // 헤일리 쌤
  'UCh-cJriwFpmGf65b_yZhUUw': 'cat-faith', // 현승원TV
  'UCpj0CzATn2UROFHBOZWs7hw': null, // 혼돈의경제학
  'UCg6IlhycdYiK_nWB3spjIqA': 'cat-ai', // 홍정모
  'UCRPRCmoQrbQ2qef7HpHz6GA': 'cat-history', // 황현필 한국사
  'UCtGmUJ92gdjC5GwzGYj7Tug': 'cat-ai', // 흥달쌤
};
