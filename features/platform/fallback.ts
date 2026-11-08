import type { SitePayload } from './types'

/**
 * The copy shipped with the site. It is used when the platform API cannot be reached, so the
 * marketing site stays readable while the CMS is being provisioned. Anything an administrator
 * saves in the CMS replaces this at render time.
 */
export const fallbackSite: SitePayload = {
  baseDomain: '',
  settings: {
    brandName: 'هم‌اوج',
    tagline: 'سامانه مدیریت باشگاه و گروه‌های ورزشی',
    heroEyebrow: 'مدیریت باشگاه، بدون کاغذبازی',
    heroTitle: 'باشگاهت را منظم کن،',
    heroHighlight: 'تمرین را جدی بگیر.',
    heroSubtitle:
      'هم‌اوج همه‌چیز را یک‌جا جمع می‌کند: اعضا، مربی‌ها، برنامه‌های تمرینی، حضور و غیاب، پرداخت‌ها و گزارش‌ها. پورتال اختصاصی شما در چند دقیقه آماده است.',
    primaryCtaLabel: 'ساخت پورتال باشگاه',
    primaryCtaHref: '/start',
    secondaryCtaLabel: 'دیدن پلن‌ها و قیمت‌ها',
    secondaryCtaHref: '/pricing',
    proof: 'اطلاعات اعضا در سرور اختصاصی خودتان می‌ماند.',
    contactEmail: 'hello@hamowj.ir',
    contactPhone: null,
    contactAddress: null,
    instagramUrl: null,
    telegramUrl: null,
    footerNote: 'هم‌اوج؛ ساخته‌شده برای باشگاه‌های ایرانی.',
    metaTitle: 'هم‌اوج | نرم‌افزار مدیریت باشگاه و گروه‌های ورزشی',
    metaDescription:
      'هم‌اوج سامانه یکپارچه مدیریت باشگاه است: پرونده اعضا، برنامه تمرینی مربی، حضور و غیاب، اشتراک و پرداخت، گزارش درآمد و پورتال اختصاصی برای هر باشگاه.',
    metaKeywords: 'مدیریت باشگاه, نرم‌افزار باشگاه, مدیریت اعضا, برنامه تمرینی, مربی, پرداخت باشگاه, هم‌اوج',
    canonicalBaseUrl: null,
    ogImageUrl: null,
    googleSiteVerification: null,
    bingSiteVerification: null,
    allowIndexing: true,
    updatedAtUtc: new Date(0).toISOString(),
    updatedBy: null,
  },
  features: [
    {
      id: 1,
      title: 'پرونده کامل اعضا',
      description:
        'همه‌چیز یک عضو از اشتراک و سابقه تمرین تا پرداخت‌ها، یادآوری تمدید و عکس پیشرفت، در یک صفحه.',
      icon: 'members',
      sortOrder: 0,
      isActive: true,
    },
    {
      id: 2,
      title: 'برنامه تمرینی و مربی',
      description:
        'برنامه بسازید، به اعضا اختصاص دهید و پیشرفت هر حرکت را بدون فایل اکسل دنبال کنید.',
      icon: 'plans',
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 3,
      title: 'حضور و غیاب دقیق',
      description:
        'ورود اعضا را ثبت کنید، ظرفیت کلاس‌ها را ببینید و گزارش حضور هر ماه را در یک نگاه بگیرید.',
      icon: 'checklist',
      sortOrder: 2,
      isActive: true,
    },
    {
      id: 4,
      title: 'اشتراک و پرداخت',
      description:
        'محصول و اشتراک بسازید، صورتحساب صادر کنید و با درگاه زرین‌پال پرداخت آنلاین بگیرید.',
      icon: 'payments',
      sortOrder: 3,
      isActive: true,
    },
    {
      id: 5,
      title: 'پیام و اعلان',
      description:
        'یادآوری تمدید، پیام به گروه‌های اعضا و اعلان‌های داخل پورتال، بدون پخش آگهی.',
      icon: 'message',
      sortOrder: 4,
      isActive: true,
    },
    {
      id: 6,
      title: 'گزارش درآمد و رشد',
      description:
        'درآمد، تمدید، ماندگاری و ترکیب اعضا را ببینید؛ تصمیم‌ها را با عدد بگیرید.',
      icon: 'reports',
      sortOrder: 5,
      isActive: true,
    },
  ],
  faqs: [
    {
      id: 1,
      question: 'پورتال اختصاصی چه فرقی با یک پنل مشترک دارد؟',
      answer:
        'هر باشگاه پورتال و پایگاه‌داده مستقل خودش را دارد. نشانی شما می‌شود زیردامنه خودتان و اطلاعات اعضا بین باشگاه‌ها به اشتراک گذاشته نمی‌شود.',
      sortOrder: 0,
      isActive: true,
    },
    {
      id: 2,
      question: 'برای شروع باید چه‌کاری کنم؟',
      answer:
        'پلن را انتخاب کنید، نام باشگاه و نشانی دلخواه را وارد کنید و حساب مدیر را بسازید. پس از ثبت، نشانی ورود و اطلاعات اولیه برای شما صادر می‌شود.',
      sortOrder: 1,
      isActive: true,
    },
    {
      id: 3,
      question: 'اطلاعات اعضا امن است؟',
      answer:
        'بله. دسترسی‌ها نقش‌محور است، هر نقش فقط داده‌های مجاز خودش را می‌بیند و عملیات حساس در پورتال ثبت می‌شود.',
      sortOrder: 2,
      isActive: true,
    },
    {
      id: 4,
      question: 'می‌توانم پلن را بعداً تغییر دهم؟',
      answer:
        'بله. پلن در هر زمان قابل ارتقا یا تغییر است و محدودیت‌های عضو و مربی با پلن جدید هم‌راستا می‌شود.',
      sortOrder: 3,
      isActive: true,
    },
  ],
  plans: [
    {
      id: 'starter',
      code: 'starter',
      name: 'پایه',
      description: 'برای باشگاه‌های کوچک که تازه دیجیتالی می‌شوند.',
      monthlyPriceToman: 490000,
      yearlyPriceToman: 4900000,
      features: [
        'تا ۱۵۰ عضو فعال',
        'تا ۳ مربی',
        'پرونده عضو و اشتراک',
        'برنامه تمرینی پایه',
        'حضور و غیاب',
        'گزارش‌های پایه',
      ],
      isPopular: false,
      isActive: true,
      sortOrder: 0,
      tenantPlan: 0,
    },
    {
      id: 'pro',
      code: 'pro',
      name: 'حرفه‌ای',
      description: 'برای باشگاه‌های در حال رشد با چند مربی و پرداخت آنلاین.',
      monthlyPriceToman: 890000,
      yearlyPriceToman: 8900000,
      features: [
        'تا ۶۰۰ عضو فعال',
        'تا ۱۰ مربی',
        'همه امکانات پلن پایه',
        'پیام و اعلان تمدید',
        'پرداخت آنلاین و صورتحساب',
        'گزارش درآمد و ماندگاری',
        'پشتیبانی اولویت‌دار',
      ],
      isPopular: true,
      isActive: true,
      sortOrder: 1,
      tenantPlan: 1,
    },
    {
      id: 'enterprise',
      code: 'enterprise',
      name: 'سازمانی',
      description: 'برای مجموعه‌های زنجیره‌ای و باشگاه‌های چندشعبه‌ای.',
      monthlyPriceToman: 1890000,
      yearlyPriceToman: 18900000,
      features: [
        'اعضا و مربی نامحدود',
        'همه امکانات پلن حرفه‌ای',
        'مدیریت چند شعبه',
        'دسترسی API',
        'مدیر موفقیت اختصاصی',
        'قرارداد و SLA',
      ],
      isPopular: false,
      isActive: true,
      sortOrder: 2,
      tenantPlan: 2,
    },
  ],
  pages: [
    { slug: 'about', title: 'درباره هم‌اوج', summary: 'چرا هم‌اوج ساخته شد.', showInFooter: true },
    { slug: 'terms', title: 'قوانین استفاده', summary: 'شرایط استفاده از سرویس.', showInFooter: true },
    { slug: 'privacy', title: 'حریم خصوصی', summary: 'نحوه نگه‌داری داده‌ها.', showInFooter: true },
  ],
}
