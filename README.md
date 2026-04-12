# 🎭 הקרנה לתפאורה

> אפליקציית Projection Mapping לתפאורה, הופעות ואמנות — ישירות מהדפדפן.

[![Vercel](https://img.shields.io/badge/deployed-Vercel-black?logo=vercel)](https://hakrana-letifora-git-main-shai1220-4545s-projects.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)

---

## מה זה?

כלי web שמאפשר לקחת פרויקטור רגיל ולהקרין תוכן בדיוק על עצמים, קירות, תפאורה — בלי לפ-טופ כבד ובלי תוכנות יקרות.

מבוסס על הרעיון של [Lazy Lighting](https://lazylighting.app) — אבל רץ בדפדפן, על כל מחשב.

---

## ✨ פיצ'רים

### כלי מיפוי
| פיצ'ר | תיאור | סטטוס |
|-------|--------|--------|
| **Corner Pin** | גרירת 4 פינות להתאמה לכל משטח | ✅ |
| **Warp** | עיוות חופשי של התמונה | ✅ |
| **Mask** | הסתרת חלקים מההקרנה | ✅ |
| **Dual Channels** | שתי שכבות עצמאיות בו-זמנית | ✅ |

### מדיה ואפקטים
| פיצ'ר | תיאור | סטטוס |
|-------|--------|--------|
| **Video Import** | ייבוא סרטונים מהמכשיר | ✅ |
| **Image Import** | ייבוא תמונות | ✅ |
| **Kaleidoscope** | אפקט קלידוסקופ בזמן אמת | ✅ |
| **Color Shift** | שינוי צבעים דינמי | ✅ |
| **Tunnel** | אפקט מנהרה | ✅ |
| **Audio Reactive** | הקרנה שמגיבה לצליל | 🔜 |
| **MIDI Control** | שליטה דרך בקר MIDI | 🔜 |

### תשתית
| פיצ'ר | תיאור | סטטוס |
|-------|--------|--------|
| **Projector Output** | פלט נקי לפרויקטור | ✅ |
| **Save Projects** | שמירת פרויקטים בענן | 🔜 |
| **Auth / Login** | כניסה אישית | 🔜 |

---

## 🛠️ Tech Stack

```
Frontend       Next.js 14 + React 18 + TypeScript
Styling        Tailwind CSS
Canvas         Canvas API + WebGL
State          Zustand
Backend/DB     Supabase (בקרוב)
Deployment     Vercel (auto-deploy מ-GitHub)
Version Ctrl   GitHub
```

---

## 🗂️ מבנה הפרויקט

```
hakrana-letifora/
├── app/
│   ├── layout.tsx          # Layout ראשי + metadata
│   ├── page.tsx            # דף נחיתה
│   ├── globals.css         # סטיילים גלובליים
│   └── editor/
│       └── page.tsx        # ה-Editor המרכזי
│
├── components/
│   ├── canvas/
│   │   └── ProjectionCanvas.tsx   # Canvas + WebGL engine
│   └── ui/
│       ├── Toolbar.tsx            # סרגל כלים
│       ├── LayerPanel.tsx         # ניהול שכבות
│       ├── EffectsPanel.tsx       # אפקטים ושקיפות
│       └── MediaImport.tsx        # ייבוא מדיה
│
├── lib/
│   ├── types.ts            # כל הטיפוסים (Layer, Point וכו')
│   └── store.ts            # Zustand store — state המרכזי
│
├── vercel.json             # הגדרות Vercel
└── package.json
```

---

## 🚀 הרצה מקומית

```bash
# שכפל את הפרויקט
git clone https://github.com/shaipir/hakrana-letifora.git
cd hakrana-letifora

# התקן תלויות
npm install

# הרץ בmodo פיתוח
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000) בדפדפן.

---

## 🌐 Deployment

הפרויקט מחובר אוטומטית:

```
GitHub (push) → Vercel (build + deploy)
```

כל `git push` ל-`main` מפרס גרסה חדשה אוטומטית.

**לינק חי:** [hakrana-letifora.vercel.app](https://hakrana-letifora-git-main-shai1220-4545s-projects.vercel.app)

---

## 🗺️ Roadmap

### שלב 1 — MVP ✅
- [x] Canvas עם Corner Pin
- [x] שכבות ואפקטים בסיסיים
- [x] ייבוא מדיה
- [x] פריסה חיה ב-Vercel

### שלב 2 — מדיה ואפקטים 🔄
- [ ] Draw Mode — ציור חי על הקנבס
- [ ] Audio Reactive — אפקטים שמגיבים לצליל
- [ ] MIDI control
- [ ] Custom shapes

### שלב 3 — Backend
- [ ] חיבור Supabase
- [ ] שמירת פרויקטים
- [ ] ייצוא / טעינת sessions

### שלב 4 — iOS
- [ ] בחינת React Native / PWA לאייפד

---

## 📝 הערות פיתוח

- `ProjectionCanvas` רץ בלולאת `requestAnimationFrame` לאנימציה חלקה
- כלי Corner Pin עובד עם mouse events ישירות על ה-canvas
- ה-store (Zustand) מנהל את כל המצב — שכבות, כלי פעיל, מצב פרויקטור
- קומפוננטים שמשתמשים ב-browser APIs נטענים עם `dynamic` + `ssr: false`

---

## 🔗 השראה

- [Lazy Lighting](https://lazylighting.app) — האפליקציה שהשרתה את הפרויקט
- [MadMapper](https://madmapper.com) — תוכנה מקצועית ל-Projection Mapping
