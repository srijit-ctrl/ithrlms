# Supported Languages & Language Rules

The ITHR AI Tutor converses fluently in **70+ major world languages** (73 in the reference implementation, `server/tutor/languages.js`). It auto-detects the learner's language and replies in kind, allows switching at any time, and preserves technical terminology.

## Language-handling rules

1. **Auto-detect.** Determine the learner's language from their message and respond in that same language — naturally, not as a literal translation.
2. **Switch on demand.** If the learner writes in (or asks to switch to) another supported language, follow immediately and continue there.
3. **Default.** Open in the course's `defaultLanguage` until the learner's language is known.
4. **Preserve technical terms.** Keep the profile's `preserveTerms` (and standard acronyms, code, identifiers, product names) in canonical form; gloss them once in the learner's language if it aids understanding. Example: keep `context window`, `API`, `SKU`, `NIST AI RMF` rather than loosely translating them.
5. **Right-to-left.** Render RTL languages (Arabic, Urdu, Persian, Hebrew, Pashto) naturally; keep embedded Latin-script code/acronyms left-to-right.
6. **Don't downgrade rigor.** Pedagogy, scope and guardrails are identical in every language — same hints, same Socratic method, same accuracy.
7. **Unsupported language.** If a learner writes in a language outside the set, respond warmly in the closest supported language (or the default) and offer to continue there.

## The 70 core languages

| # | Language | Native name | Code | Dir |
|--|--|--|--|--|
| 1 | English | English | en | LTR |
| 2 | Chinese (Mandarin) | 中文（普通话） | zh | LTR |
| 3 | Chinese (Traditional) | 中文（繁體） | zh-TW | LTR |
| 4 | Spanish | Español | es | LTR |
| 5 | Hindi | हिन्दी | hi | LTR |
| 6 | Arabic | العربية | ar | RTL |
| 7 | Bengali | বাংলা | bn | LTR |
| 8 | Portuguese | Português | pt | LTR |
| 9 | Russian | Русский | ru | LTR |
| 10 | Japanese | 日本語 | ja | LTR |
| 11 | Punjabi | ਪੰਜਾਬੀ | pa | LTR |
| 12 | German | Deutsch | de | LTR |
| 13 | Javanese | Basa Jawa | jv | LTR |
| 14 | Korean | 한국어 | ko | LTR |
| 15 | French | Français | fr | LTR |
| 16 | Telugu | తెలుగు | te | LTR |
| 17 | Marathi | मराठी | mr | LTR |
| 18 | Turkish | Türkçe | tr | LTR |
| 19 | Tamil | தமிழ் | ta | LTR |
| 20 | Vietnamese | Tiếng Việt | vi | LTR |
| 21 | Urdu | اردو | ur | RTL |
| 22 | Italian | Italiano | it | LTR |
| 23 | Persian (Farsi) | فارسی | fa | RTL |
| 24 | Gujarati | ગુજરાતી | gu | LTR |
| 25 | Polish | Polski | pl | LTR |
| 26 | Ukrainian | Українська | uk | LTR |
| 27 | Kannada | ಕನ್ನಡ | kn | LTR |
| 28 | Malayalam | മലയാളം | ml | LTR |
| 29 | Indonesian | Bahasa Indonesia | id | LTR |
| 30 | Thai | ไทย | th | LTR |
| 31 | Dutch | Nederlands | nl | LTR |
| 32 | Filipino (Tagalog) | Filipino | fil | LTR |
| 33 | Romanian | Română | ro | LTR |
| 34 | Greek | Ελληνικά | el | LTR |
| 35 | Czech | Čeština | cs | LTR |
| 36 | Swedish | Svenska | sv | LTR |
| 37 | Hungarian | Magyar | hu | LTR |
| 38 | Hebrew | עברית | he | RTL |
| 39 | Swahili | Kiswahili | sw | LTR |
| 40 | Malay | Bahasa Melayu | ms | LTR |
| 41 | Burmese | မြန်မာ | my | LTR |
| 42 | Sinhala | සිංහල | si | LTR |
| 43 | Nepali | नेपाली | ne | LTR |
| 44 | Khmer | ខ្មែរ | km | LTR |
| 45 | Lao | ລາວ | lo | LTR |
| 46 | Pashto | پښتو | ps | RTL |
| 47 | Amharic | አማርኛ | am | LTR |
| 48 | Yoruba | Yorùbá | yo | LTR |
| 49 | Igbo | Igbo | ig | LTR |
| 50 | Hausa | Hausa | ha | LTR |
| 51 | Zulu | isiZulu | zu | LTR |
| 52 | Xhosa | isiXhosa | xh | LTR |
| 53 | Afrikaans | Afrikaans | af | LTR |
| 54 | Finnish | Suomi | fi | LTR |
| 55 | Danish | Dansk | da | LTR |
| 56 | Norwegian | Norsk | no | LTR |
| 57 | Slovak | Slovenčina | sk | LTR |
| 58 | Bulgarian | Български | bg | LTR |
| 59 | Serbian | Српски | sr | LTR |
| 60 | Croatian | Hrvatski | hr | LTR |
| 61 | Bosnian | Bosanski | bs | LTR |
| 62 | Slovenian | Slovenščina | sl | LTR |
| 63 | Lithuanian | Lietuvių | lt | LTR |
| 64 | Latvian | Latviešu | lv | LTR |
| 65 | Estonian | Eesti | et | LTR |
| 66 | Azerbaijani | Azərbaycanca | az | LTR |
| 67 | Kazakh | Қазақша | kk | LTR |
| 68 | Uzbek | Oʻzbekcha | uz | LTR |
| 69 | Georgian | ქართული | ka | LTR |
| 70 | Armenian | Հայերեն | hy | LTR |

The reference implementation additionally ships Mongolian (`mn`), Catalan (`ca`) and Icelandic (`is`) — 73 total. Add or remove entries in `server/tutor/languages.js`; the count flows into the prompt's `{{LANGUAGE_COUNT}}` automatically.
