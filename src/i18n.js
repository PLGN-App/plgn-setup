// One phrase table for English and Arabic. Each task adds its keys above the two end markers.
// Rules: Western digits only, "points" never "credits", plgn always lowercase.
// Commands, paths and URLs stay in Latin letters and arrive as {vars}.

export const LANGS = ["en", "ar"];

export const phrases = {
  en: {
    intro: "plgn setup: connect your AI tools to plgn.",
    help:
      "Usage:\n" +
      "  npx plgn-setup [tool] [--yes] [--dry-run] [--lang en|ar]\n" +
      "  npx plgn-setup doctor\n" +
      "Tools: {hosts}",
    pick: "Which tools should get plgn?",
    detected: "found on this computer",
    noneFound: "No AI tools found here. Name one: npx plgn-setup <tool>. Tools: {hosts}",
    needYes: "This is not an interactive terminal. Add --yes to set up: {hosts}",
    nothingChanged: "Nothing changed.",
    unknownHost: "Unknown tool: {name}. Tools: {hosts}",
    unknownLang: "Unknown language: {lang}. Use en or ar.",
    badArgs: "{detail}. See npx plgn-setup --help",
    added: "{label}: plgn added to {file}",
    updated: "{label}: plgn entry updated in {file}",
    same: "{label}: already set, nothing changed",
    wouldAdd: "{label}: would add plgn to {file}",
    wouldUpdate: "{label}: would update the plgn entry in {file}",
    backup: "Backup of the old file: {file}",
    notReadable: "{label}: could not read {file}, so it was left alone. Add this by hand:",
    notSafe: "{label}: could not add plgn to {file} without touching other lines, so it was left alone. Add this by hand:",
    dryRun: "Dry run: nothing was written.",
    nextTitle: "Next, log in once in each tool:",
    "next.runCommand": "{label}: run {cmd}",
    "next.typeInside": "{label}: open it and type {cmd}",
    ran: "{label}: ran {cmd}",
    failed: "{label}: {cmd} failed: {detail}",
    "doctor.notFound": "not found on this computer",
    "doctor.fileFound": "{file}",
    "doctor.fileMissing": "no config file at {file}",
    "doctor.entryOk": "plgn is set to {url}",
    "doctor.entryMissing": "no plgn entry",
    "doctor.entryWrong": "the plgn entry has an old address: {url}",
    "doctor.unreadable": "could not read {file}",
    "doctor.version": "{version}",
    "doctor.noBinary": "{bin} is not on PATH",
    "doctor.entryDiffers": "the plgn entry has the right address but other settings differ",
    // en: end
  },
  ar: {
    intro: "إعداد plgn: اربط أدوات الذكاء الاصطناعي عندك بـ plgn.",
    help:
      "الاستخدام:\n" +
      "  npx plgn-setup [tool] [--yes] [--dry-run] [--lang en|ar]\n" +
      "  npx plgn-setup doctor\n" +
      "الأدوات: {hosts}",
    pick: "أي أدوات تريد ربطها بـ plgn؟",
    detected: "موجودة على هذا الجهاز",
    noneFound: "لم نجد أي أداة ذكاء اصطناعي هنا. اذكر واحدة: npx plgn-setup <tool>. الأدوات: {hosts}",
    needYes: "هذه ليست نافذة تفاعلية. أضف --yes للإعداد: {hosts}",
    nothingChanged: "لم يتغير شيء.",
    unknownHost: "أداة غير معروفة: {name}. الأدوات: {hosts}",
    unknownLang: "لغة غير معروفة: {lang}. استخدم en أو ar.",
    badArgs: "{detail}. اكتب npx plgn-setup --help",
    added: "{label}: تمت إضافة plgn إلى {file}",
    updated: "{label}: تم تحديث إعداد plgn في {file}",
    same: "{label}: الإعداد موجود من قبل، لم يتغير شيء",
    wouldAdd: "{label}: ستتم إضافة plgn إلى {file}",
    wouldUpdate: "{label}: سيتم تحديث إعداد plgn في {file}",
    backup: "نسخة احتياطية من الملف القديم: {file}",
    notReadable: "{label}: لم نستطع قراءة {file} فتركناه كما هو. أضف هذا يدويًا:",
    notSafe: "{label}: لم نستطع إضافة plgn إلى {file} دون لمس باقي الأسطر فتركناه كما هو. أضف هذا يدويًا:",
    dryRun: "تجربة فقط: لم تتم كتابة أي شيء.",
    nextTitle: "بعد ذلك، سجّل الدخول مرة واحدة في كل أداة:",
    "next.runCommand": "{label}: شغّل {cmd}",
    "next.typeInside": "{label}: افتحها واكتب {cmd}",
    ran: "{label}: تم تشغيل {cmd}",
    failed: "{label}: فشل {cmd}: {detail}",
    "doctor.notFound": "غير موجودة على هذا الجهاز",
    "doctor.fileFound": "{file}",
    "doctor.fileMissing": "لا يوجد ملف إعداد في {file}",
    "doctor.entryOk": "plgn مضبوط على {url}",
    "doctor.entryMissing": "لا يوجد إعداد plgn",
    "doctor.entryWrong": "إعداد plgn فيه عنوان قديم: {url}",
    "doctor.unreadable": "لم نستطع قراءة {file}",
    "doctor.version": "{version}",
    "doctor.noBinary": "{bin} غير موجود في PATH",
    "doctor.entryDiffers": "إعداد plgn عنوانه صحيح لكن إعدادات أخرى فيه مختلفة",
    // ar: end
  },
};

export function t(lang, key, vars = {}) {
  if (!Object.hasOwn(phrases, lang)) throw new Error(`Unknown language: ${lang}`);
  if (!Object.hasOwn(phrases[lang], key)) throw new Error(`Unknown phrase key: ${key}`);
  return phrases[lang][key].replace(/\{(\w+)\}/g, (whole, name) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : whole,
  );
}
