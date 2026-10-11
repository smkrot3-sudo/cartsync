/* Bilingual strings + RTL/LTR switching. Pure UI text lives here; app.js reads it via CS.t(key). */
const STRINGS = {
he: {
  appName:'קניות ביחד', tagline:'רשימת קניות אחת, לכל המשפחה',
  authHero:'רשימת קניות אחת, לכל המשפחה',
  authSub:'מוסיפים, מסמנים, ורואים את זה חי אצל כולם — גם כשכל אחד בחלק אחר של הסופר.',
  login:'התחברות', signup:'הרשמה', name:'השם שלך', email:'מייל', password:'סיסמה (לפחות 6 תווים)',
  loginGo:'להתחבר', signupGo:'ליצור חשבון', forgot:'שכחתי סיסמה', resetGo:'לשלוח קישור לאיפוס',
  resetSent:'📬 שלחנו מייל עם קישור לבחירת סיסמה חדשה.',
  onboardTitle:'למי קונים?', onboardSub:'יוצרים משק בית, או מצטרפים לאחד קיים עם קוד הזמנה.',
  createHh:'משק בית חדש', hhNamePh:'לדוגמה: הבית שלנו', create:'ליצור',
  joinHh:'יש לי קוד הזמנה', codePh:'קוד הזמנה', join:'להצטרף',
  itemPh:'להוסיף מוצר…', add:'הוספה',
  pendingTitle:'בקשות לאישור', boughtTitle:'נקנה', emptyList:'הרשימה ריקה. מה חסר בבית?',
  invite:'הזמנת חבר/ה', inviteSub:'כל מי שמקבל את הקוד הזה יכול להצטרף תוך 7 ימים.',
  inviteRole:'הרשאה לחברים חדשים:', inviteCopy:'להעתיק קוד', inviteCopied:'📋 הועתק',
  roleOwner:'ראש/ת משק בית', roleEditor:'עריכה מלאה', roleRequester:'בקשת מוצרים', roleViewer:'צפייה בלבד',
  members:'חברי משק הבית', signOut:'יציאה', deleteAccount:'מחיקת חשבון', syncNow:'לסנכרן עכשיו',
  settings:'הגדרות', language:'שפה', switchHousehold:'להחליף משק בית',
  itemAdded:'✅ נוסף לרשימה', itemRequested:'🙋 הבקשה נשלחה לאישור', itemApproved:'✅ אושר',
  confirmDelete:'למחוק מהרשימה?', yes:'כן', cancel:'ביטול',
  offline:'📴 אין רשת כרגע. מה שתשנו יתעדכן כשהרשת תחזור.',
  errGeneric:'משהו לא הסתדר, אפשר לנסות שוב.',
  errInvite:'קוד ההזמנה לא תקין או פג תוקף.',
  needHhName:'צריך לתת שם למשק הבית', needCode:'צריך להזין קוד',
},
en: {
  appName:'CartSync', tagline:'One shopping list, for the whole family',
  authHero:'One shopping list, for the whole family',
  authSub:'Add, check off, and see it live for everyone — even when you split up around the store.',
  login:'Log in', signup:'Sign up', name:'Your name', email:'Email', password:'Password (6+ characters)',
  loginGo:'Log in', signupGo:'Create account', forgot:'Forgot password', resetGo:'Send reset link',
  resetSent:'📬 We sent an email with a link to set a new password.',
  onboardTitle:'Shopping for who?', onboardSub:'Create a household, or join one with an invite code.',
  createHh:'New household', hhNamePh:'e.g. Our home', create:'Create',
  joinHh:'I have an invite code', codePh:'Invite code', join:'Join',
  itemPh:'Add an item…', add:'Add',
  pendingTitle:'Needs approval', boughtTitle:'Bought', emptyList:'The list is empty. What are we out of?',
  invite:'Invite someone', inviteSub:'Anyone with this code can join within 7 days.',
  inviteRole:'Role for new members:', inviteCopy:'Copy code', inviteCopied:'📋 Copied',
  roleOwner:'Household head', roleEditor:'Full editor', roleRequester:'Can request items', roleViewer:'View only',
  members:'Household members', signOut:'Sign out', deleteAccount:'Delete account', syncNow:'Sync now',
  settings:'Settings', language:'Language', switchHousehold:'Switch household',
  itemAdded:'✅ Added to the list', itemRequested:'🙋 Request sent for approval', itemApproved:'✅ Approved',
  confirmDelete:'Remove from the list?', yes:'Yes', cancel:'Cancel',
  offline:'📴 No connection right now. Changes will sync once you\'re back online.',
  errGeneric:'Something went wrong, try again.',
  errInvite:'That invite code is invalid or expired.',
  needHhName:'Give the household a name', needCode:'Enter a code',
},
};

const AUTH_ERR = {
he: {
  'Invalid login credentials':'המייל או הסיסמה לא נכונים.',
  'Email not confirmed':'עוד לא אישרת את המייל. בדקו גם בספאם.',
  'User already registered':'כבר יש חשבון עם המייל הזה. אפשר פשוט להתחבר.',
  'Password should be at least 6 characters':'הסיסמה צריכה להיות לפחות 6 תווים.',
  'Unable to validate email address: invalid format':'נראה שהמייל לא כתוב נכון.',
  'is invalid':'נראה שהמייל לא כתוב נכון, או שהשרת לא מקבל כתובות מהסוג הזה.',
  'Failed to fetch':'אין חיבור לאינטרנט כרגע.',
},
en: {
  'Invalid login credentials':'Wrong email or password.',
  'Email not confirmed':'Please confirm your email first (check spam too).',
  'User already registered':'An account with this email already exists — try logging in.',
  'Password should be at least 6 characters':'Password needs to be at least 6 characters.',
  'Unable to validate email address: invalid format':'That email doesn\'t look right.',
  'is invalid':'That email doesn\'t look right, or isn\'t accepted by the server.',
  'Failed to fetch':'No internet connection right now.',
},
};

const CATS = {
  dairy:{he:'חלבי',en:'Dairy',emoji:'🥛'},
  produce:{he:'ירקות ופירות',en:'Produce',emoji:'🥦'},
  bakery:{he:'מאפים',en:'Bakery',emoji:'🍞'},
  meat:{he:'בשר ודגים',en:'Meat & Fish',emoji:'🍗'},
  frozen:{he:'קפואים',en:'Frozen',emoji:'🧊'},
  pantry:{he:'מזווה',en:'Pantry',emoji:'🥫'},
  beverages:{he:'משקאות',en:'Beverages',emoji:'🥤'},
  snacks:{he:'חטיפים וממתקים',en:'Snacks & Sweets',emoji:'🍬'},
  household:{he:'ניקיון ובית',en:'Household',emoji:'🧽'},
  care:{he:'טיפוח',en:'Personal Care',emoji:'🧴'},
  baby:{he:'תינוקות',en:'Baby',emoji:'🍼'},
  pet:{he:'חיות מחמד',en:'Pet',emoji:'🐾'},
  other:{he:'אחר',en:'Other',emoji:'🛒'},
};
const CAT_ORDER = ['produce','dairy','bakery','meat','frozen','pantry','beverages','snacks','household','care','baby','pet','other'];

(function(){
  window.CS = window.CS || {};
  let lang = 'he';
  try{
    const saved = localStorage.getItem('cs-lang');
    lang = saved || ((navigator.language||'').toLowerCase().startsWith('en') ? 'en' : 'he');
  }catch(e){}
  if(lang!=='he'&&lang!=='en') lang='he';

  function apply(){
    document.documentElement.lang = lang;
    document.documentElement.dir = lang==='he' ? 'rtl' : 'ltr';
  }
  function t(key){ return (STRINGS[lang]&&STRINGS[lang][key]) || STRINGS.he[key] || key; }
  function authErr(e){
    const msg = (e&&e.message) || String(e);
    const table = AUTH_ERR[lang]||AUTH_ERR.he;
    const key = Object.keys(table).find(k=>msg.includes(k));
    return key ? table[key] : (STRINGS[lang]||STRINGS.he).errGeneric;
  }
  function setLang(l){ lang = l==='en'?'en':'he'; try{localStorage.setItem('cs-lang',lang)}catch(e){} apply(); if(window.CS.render) window.CS.render(); }
  apply();
  Object.assign(window.CS,{t,lang:()=>lang,setLang,authErr,CATS,CAT_ORDER});
})();
