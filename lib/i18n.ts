type Locale = "en" | "es";

function detectLocale(): Locale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale;
    return tag.startsWith("es") ? "es" : "en";
  } catch {
    return "en";
  }
}

export const locale = detectLocale();
export const isEs = locale === "es";

// ─── Strings ─────────────────────────────────────────────────────────────────

const en = {
  // Welcome
  welcomeTagline: "A ledger for everything\nhanging in your closet.",
  receiptFooter: "THE MATH IS ON YOUR SIDE",
  continueApple: "Continue with Apple",
  continueEmail: "Continue with email",
  orDivider: "OR",
  browseAsGuest: "Browse as a guest",
  noAcct: "NO ACCT",
  legalLine: "BY CONTINUING · YOU AGREE TO",
  terms: "TERMS",
  privacy: "PRIVACY",

  // Auth / login
  back: "BACK",
  openAccount: "open account",
  signIn: "sign in",
  emailPasswordRequired: "Email and password required.",
  createAccount: "create account",
  alreadyHaveAccount: "already have an account? sign in",
  noAccount: "no account? create one",

  // Home — closet ledger
  costBasis: "Cost Basis",
  wearsLogged: "Wears Logged",
  pieces: "Pieces",
  blendedCpw: "Blended CPW",
  itemCol: "ITEM",
  closetAwaits: "Your closet awaits.",
  addFirstPiece: "Tap the button below to add your first piece.",
  logWearCta: "+ Log Today's Wear",
  whatsYourName: "What's your name?",
  appearsInLedger: "IT APPEARS IN YOUR LEDGER",
  namePlaceholder: "e.g. Margot",
  saving: "SAVING...",
  continueCta: "CONTINUE",
  wearingToday: "WHAT ARE YOU WEARING TODAY?",
  fromCloset: "FROM YOUR CLOSET",
  newPiece: "New piece",
  addToCloset: "ADD TO YOUR CLOSET",

  // Item detail
  costPerWear: "COST PER WEAR",
  wears: "WEARS",
  nextTierPrefix: "· NEXT:",
  perWearShort: "/WEAR",
  freeBascially: "· FREE BASICALLY 🌸",
  spent: "SPENT",
  savedVsNew: "SAVED VS NEW",
  recentWears: "RECENT WEARS",
  currentTier: "CURRENT TIER",
  dateCol: "DATE",
  occasionCol: "OCCASION",
  cpwThenCol: "CPW THEN",
  noWearsYet: "NO WEARS LOGGED YET",
  totalWears: "TOTAL WEARS",
  netCpw: "NET CPW",
  keepReceipt: "* KEEP THIS RECEIPT *",
  occasionOptional: "OCCASION (OPTIONAL)",
  skip: "SKIP",
  iWoredThis: "+ I wore this today",
  acquired: "ACQUIRED",
  perWear: "/wear",

  // Add item modal
  cancel: "CANCEL",
  newAsset: "New Asset",
  tapToAddPhoto: "TAP TO ADD PHOTO",
  itemName: "Item Name",
  brand: "Brand",
  costBasisField: "Cost Basis ($)",
  acquiredDate: "Acquired (YYYY-MM-DD)",
  category: "Category",
  nameRequired: "Name is required.",
  validCostBasis: "Enter a valid cost basis.",
  failedToSave: "Failed to save. Try again.",
  logAsset: "Log Asset",

  // Onboarding
  step2Label: "STEP 2 / 3 · THE HOOK",
  step3Label: "STEP 3 / 3 · THE MATH",
  guiltPieceHeadline: "What's the piece\nyou feel\n",
  guiltPieceAccent: "guilty about?",
  onboardingDesc:
    "We'll show you exactly how many wears she needs to pay herself off. Pick the most expensive thing in your closet.",
  orScanReceipt: "OR SCAN A RECEIPT",
  nameCostBasis: "NAME",
  brandLabel: "BRAND",
  costBasisLabel: "COST BASIS ($)",
  giveAName: "Give this piece a name.",
  enterCostBasis: "Enter the cost basis.",
  couldntSave: "Couldn't save. Try again.",
  runNumbers: "Run the numbers →",
  heresDeal: "OK, HERE'S THE DEAL ↓",
  everyWearDrops: "EVERY WEAR DROPS THE COST",
  oatMilkQuote: "Wear it {n} times and it costs less per wear than your weekly oat milk.",
  openCloset: "Open my closet →",

  // Me / settings
  accountSettings: "ACCOUNT · SETTINGS",
  becomeShareholder: "★ BECOME · A · SHAREHOLDER",
  upgradeTagline: "Unlimited pieces.\nWrapped. Wishlist.",
  upgradePrice: "$2.50 / mo · 7-day free",
  upgradeCta: "Upgrade →",
  activeSubscription: "Active subscription",
  spotsLeft: "{n} SPOTS LEFT",
  preferences: "PREFERENCES",
  currency: "Currency",
  weekStarts: "Week starts",
  sunday: "Sunday",
  defaultCategory: "Default category",
  outerwear: "Outerwear",
  depreciationModel: "Depreciation model",
  notifications: "NOTIFICATIONS",
  dailyReminder: "Daily log reminder",
  underperformerAlerts: "Underperformer alerts",
  shareholderActivity: "Shareholder activity",
  weeklyReport: "Weekly earnings report",
  data: "DATA",
  connectedAccounts: "Connected accounts",
  exportLedger: "Export ledger",
  portfolioAnalytics: "Portfolio analytics",
  account: "ACCOUNT",
  signOut: "Sign out",
  footerVersion: "WEARS · V1.0.0 · COST BASIS: JUSTIFIED",
} as const;

const es: typeof en = {
  // Welcome
  welcomeTagline: "El ledger de todo lo que\ncuelga en tu closet.",
  receiptFooter: "LOS NÚMEROS ESTÁN DE TU LADO",
  continueApple: "Continuar con Apple",
  continueEmail: "Continuar con email",
  orDivider: "O",
  browseAsGuest: "Explorar sin cuenta",
  noAcct: "SIN CUENTA",
  legalLine: "AL CONTINUAR · ACEPTAS LOS",
  terms: "TÉRMINOS",
  privacy: "PRIVACIDAD",

  // Auth / login
  back: "ATRÁS",
  openAccount: "abrir cuenta",
  signIn: "iniciar sesión",
  emailPasswordRequired: "Email y contraseña son requeridos.",
  createAccount: "crear cuenta",
  alreadyHaveAccount: "¿ya tienes cuenta? inicia sesión",
  noAccount: "¿sin cuenta? créala",

  // Home — closet ledger
  costBasis: "Base de costo",
  wearsLogged: "Usos registrados",
  pieces: "Prendas",
  blendedCpw: "CPW combinado",
  itemCol: "PRENDA",
  closetAwaits: "Tu closet te espera.",
  addFirstPiece: "Toca el botón de abajo para agregar tu primera prenda.",
  logWearCta: "+ Registrar uso de hoy",
  whatsYourName: "¿Cómo te llamas?",
  appearsInLedger: "APARECE EN TU LEDGER",
  namePlaceholder: "ej. Valentina",
  saving: "GUARDANDO...",
  continueCta: "CONTINUAR",
  wearingToday: "¿QUÉ LLEVAS PUESTO HOY?",
  fromCloset: "DE TU CLOSET",
  newPiece: "Nueva prenda",
  addToCloset: "AGREGAR AL CLOSET",

  // Item detail
  costPerWear: "COSTO POR USO",
  wears: "USOS",
  nextTierPrefix: "· SIGUIENTE:",
  perWearShort: "/USO",
  freeBascially: "· BÁSICAMENTE GRATIS 🌸",
  spent: "INVERTIDO",
  savedVsNew: "AHORRADO VS NUEVO",
  recentWears: "USOS RECIENTES",
  currentTier: "NIVEL ACTUAL",
  dateCol: "FECHA",
  occasionCol: "OCASIÓN",
  cpwThenCol: "CPW ENTONCES",
  noWearsYet: "AÚN SIN USOS REGISTRADOS",
  totalWears: "USOS TOTALES",
  netCpw: "CPW NETO",
  keepReceipt: "* GUARDA ESTE RECIBO *",
  occasionOptional: "OCASIÓN (OPCIONAL)",
  skip: "OMITIR",
  iWoredThis: "+ Lo usé hoy",
  acquired: "ADQUIRIDA",
  perWear: "/uso",

  // Add item modal
  cancel: "CANCELAR",
  newAsset: "Nuevo activo",
  tapToAddPhoto: "TOCA PARA AGREGAR FOTO",
  itemName: "Nombre de la prenda",
  brand: "Marca",
  costBasisField: "Base de costo ($)",
  acquiredDate: "Adquirida (YYYY-MM-DD)",
  category: "Categoría",
  nameRequired: "El nombre es requerido.",
  validCostBasis: "Ingresa una base de costo válida.",
  failedToSave: "No se pudo guardar. Inténtalo de nuevo.",
  logAsset: "Registrar activo",

  // Onboarding
  step2Label: "PASO 2 / 3 · EL GANCHO",
  step3Label: "PASO 3 / 3 · LOS NÚMEROS",
  guiltPieceHeadline: "¿Qué prenda te da\nmás\n",
  guiltPieceAccent: "culpa haber comprado?",
  onboardingDesc:
    "Te mostramos cuántos usos necesita para pagarse sola. Elige la prenda más cara de tu closet.",
  orScanReceipt: "O ESCANEA UN RECIBO",
  nameCostBasis: "NOMBRE",
  brandLabel: "MARCA",
  costBasisLabel: "BASE DE COSTO ($)",
  giveAName: "Dale un nombre a esta prenda.",
  enterCostBasis: "Ingresa la base de costo.",
  couldntSave: "No se pudo guardar. Inténtalo de nuevo.",
  runNumbers: "Calcular ahora →",
  heresDeal: "OKI, ASÍ ESTÁN LAS COSAS ↓",
  everyWearDrops: "CADA USO BAJA EL COSTO",
  oatMilkQuote: "Úsala {n} veces y cuesta menos por uso que tu oat milk semanal.",
  openCloset: "Abrir mi closet →",

  // Me / settings
  accountSettings: "CUENTA · AJUSTES",
  becomeShareholder: "★ CONVIÉRTETE · EN · ACCIONISTA",
  upgradeTagline: "Prendas ilimitadas.\nWrapped. Wishlist.",
  upgradePrice: "$2.50 / mes · 7 días gratis",
  upgradeCta: "Mejorar plan →",
  activeSubscription: "Suscripción activa",
  spotsLeft: "{n} LUGARES DISPONIBLES",
  preferences: "PREFERENCIAS",
  currency: "Moneda",
  weekStarts: "Semana inicia",
  sunday: "Domingo",
  defaultCategory: "Categoría por defecto",
  outerwear: "Abrigos",
  depreciationModel: "Modelo de depreciación",
  notifications: "NOTIFICACIONES",
  dailyReminder: "Recordatorio diario",
  underperformerAlerts: "Alertas de bajo rendimiento",
  shareholderActivity: "Actividad de accionistas",
  weeklyReport: "Reporte semanal de ganancias",
  data: "DATOS",
  connectedAccounts: "Cuentas conectadas",
  exportLedger: "Exportar ledger",
  portfolioAnalytics: "Análisis de portfolio",
  account: "CUENTA",
  signOut: "Cerrar sesión",
  footerVersion: "WEARS · V1.0.0 · BASE DE COSTO: JUSTIFICADA",
};

const strings: Record<Locale, typeof en> = { en, es };

export function t(key: keyof typeof en, vars?: Record<string, string>): string {
  let str: string = strings[locale][key] ?? strings.en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return str;
}
