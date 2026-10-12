/* Bilingual strings + RTL/LTR switching. Pure UI text lives here; app.js reads it via CS.t(key). */
const STRINGS = {
he: {
  appName:'קניות ביחד', tagline:'רשימת קניות אחת, לכל המשפחה', langLabel:'שפה',
  authHero:'רשימת קניות אחת, לכל המשפחה',
  authSub:'מוסיפים, מסמנים, ורואים את זה חי אצל כולם — גם כשכל אחד בחלק אחר של הסופר.',
  login:'התחברות', signup:'הרשמה', name:'השם שלך', email:'מייל', password:'סיסמה (לפחות 6 תווים)',
  loginGo:'להתחבר', signupGo:'ליצור חשבון', forgot:'שכחתי סיסמה', resetGo:'לשלוח קישור לאיפוס',
  resetSent:'📬 שלחנו מייל עם קישור לבחירת סיסמה חדשה.',
  onboardTitle:'למי קונים?', onboardSub:'יוצרים משק בית, או מצטרפים לאחד קיים עם קוד הזמנה.',
  createHh:'משק בית חדש', hhNamePh:'לדוגמה: הבית שלנו', create:'ליצור',
  joinHh:'יש לי קוד הזמנה', codePh:'קוד הזמנה', join:'להצטרף',
  itemPh:'להוסיף מוצר…', qtyPh:'כמות', add:'הוספה',
  pendingTitle:'בקשות לאישור', boughtTitle:'נקנה', emptyList:'הרשימה ריקה. מה חסר בבית?',
  activityTitle:'היסטוריית פעולות', activityEmpty:'אין עדיין פעולות ברשימה',
  actAdded:'{n} הוסיף/ה: {t}', actRequested:'{n} ביקש/ה להוסיף: {t}', actApproved:'{n} אישר/ה בקשה: {t}',
  actRejected:'{n} דחה/תה בקשה: {t}', actChecked:'{n} אסף/ה: {t}', actUnchecked:'{n} ביטל/ה איסוף: {t}', actDeleted:'{n} הסיר/ה: {t}',
  invite:'הזמנת חבר/ה', inviteSub:'כל מי שמקבל את הקוד או הקישור הזה יכול להצטרף תוך 7 ימים.',
  inviteRole:'הרשאה לחברים חדשים:', inviteCopy:'להעתיק קוד', inviteCopied:'📋 הועתק',
  inviteShare:'📤 שליחת קישור הזמנה', inviteShareText:'הצטרפו אלינו ב"קניות ביחד" כדי לנהל יחד את רשימת הקניות:',
  joinedViaLink:'✅ הצטרפת למשק הבית!',
  roleOwner:'ראש/ת משק בית', roleEditor:'עריכה מלאה', roleRequester:'בקשת מוצרים', roleViewer:'צפייה בלבד',
  members:'חברי משק הבית', signOut:'יציאה', deleteAccount:'מחיקת חשבון', syncNow:'לסנכרן עכשיו',
  settings:'הגדרות', language:'שפה', switchHousehold:'להחליף משק בית',
  itemAdded:'✅ נוסף לרשימה', itemRequested:'🙋 הבקשה נשלחה לאישור', itemApproved:'✅ אושר',
  confirmDelete:'למחוק מהרשימה?', yes:'כן', cancel:'ביטול',
  offline:'📴 אין רשת כרגע. מה שתשנו יתעדכן כשהרשת תחזור.',
  errGeneric:'משהו לא הסתדר, אפשר לנסות שוב.',
  errInvite:'קוד ההזמנה לא תקין או פג תוקף.',
  needHhName:'צריך לתת שם למשק הבית', needCode:'צריך להזין קוד',
  versionLabel:'גרסה: {v}', updateAvailable:'יש עדכון', updateNow:'🔄 לעדכן',
  updateDownloading:'מוריד...', updateFailed:'העדכון נכשל, אפשר לנסות שוב', updateDone:'✅ מותקן',
  themeLabel:'מצב תצוגה', themeLight:'☀️ בהיר', themeDark:'🌙 כהה', themeSystem:'⚙️ אוטומטי',
  addedBy:'הוספה ע״י {n}', checkedBy:'נאסף ע״י {n}',
  tripActive:'סבב קניות פעיל', tripClose:'✅ סיום קניות', tripCloseTitle:'לסיים את סבב הקניות?',
  tripCloseBody:'הרשימה תיסגר ותישמר בהיסטוריה, כולל מוצרים שלא נלקחו. אפשר תמיד ליצור רשימה חדשה.',
  tripCloseBodyEmpty:'כל הפריטים ברשימה נאספו. הרשימה תיסגר ותישמר בהיסטוריה.',
  tripCloseBodyUnchecked:'יש {n} פריטים שלא נאספו. מה לעשות איתם?',
  tripLeave:'להשאיר ברשימה הסגורה', tripMoveExisting:'להעביר לרשימה פתוחה אחרת', tripMoveNew:'להעביר לרשימה חדשה',
  tripClosed:'✅ הרשימה נסגרה', boughtHeader:'נאסף', notBoughtHeader:'חסר',
  homeSub:'כל הרשימות המשותפות של משק הבית, במקום אחד.',
  homeLists:'הרשימות שלי', homeInvite:'הזמנת בן/בת משפחה', homeSwitch:'להחליף משק בית',
  listsTitle:'הרשימות שלי', listsOpenTitle:'פעילות', listsClosedTitle:'היסטוריה',
  listsEmpty:'אין עדיין רשימות פעילות. ליצור אחת?', newListTitle:'רשימה חדשה', newListName:'שם הרשימה (לדוגמה: קניות לשבת)',
  newListGo:'ליצור ולפתוח', needListName:'צריך לתת שם לרשימה',
  itemsCount:'{n} פריטים', closedOn:'נסגרה ב-{d}',
  deleteList:'🗑️ מחיקה', deleteListTitle:'מחיקת רשימה', deleteListConfirm:'למחוק לצמיתות את הרשימה "{n}"? לא ניתן לשחזר.', listDeleted:'🗑️ הרשימה נמחקה',
  notifyListOpened:'🛒 {n} פתח/ה רשימה חדשה: {l}', notifyListClosed:'✅ {n} סיים/ה קניות ב-{l}',
  undo:'↩️ בטל', deleted:'🗑️ נמחק', editItem:'עריכת מוצר', editSave:'לשמור',
  fontSizeLabel:'גודל טקסט', fontNormal:'רגיל', fontLarge:'גדול', fontXlarge:'גדול מאוד',
  searchPh:'חיפוש ברשימה…', newPendingToast:'🙋 {n} ביקש/ה להוסיף: {t}',
  dupWarning:'"{n}" כבר ברשימה.', dupAddAnyway:'להוסיף בכל זאת',
  manageMembers:'👥 ניהול חברי משק הבית', membersTitle:'חברי משק הבית',
  removeConfirm:'להסיר את {n} ממשק הבית?', leaveConfirm:'לצאת ממשק הבית?',
  removeTitle:'הסרת חבר/ת משק בית', leaveTitle:'יציאה ממשק הבית', removeAction:'להסיר', leaveAction:'לצאת',
  leaveHousehold:'יציאה ממשק הבית', memberRemoved:'✅ הוסר/ה ממשק הבית', youLeft:'👋 יצאת ממשק הבית',
  transferOwnerAction:'העברת בעלות', transferOwnerTitle:'העברת בעלות על משק הבית',
  transferOwnerConfirm:'להעביר את הבעלות על משק הבית ל{n}? את/ה תהפכו לעורך/ת, ול{n} תהיה שליטה מלאה כבעלים.',
  ownerTransferred:'👑 הבעלות הועברה',
  roleUpdated:'✅ ההרשאה עודכנה', you:'(את/ה)',
  editNameTitle:'שם במשק הבית הזה', editNameSub:'איך שמך יוצג לשאר חברי משק הבית הזה. אפשר לקבוע שם שונה בכל משק בית.',
  nameUpdated:'✅ השם עודכן',
  profileTitle:'עריכת פרופיל', profileNameSub:'השם שלך (ברירת מחדל למשקי בית חדשים שתצטרף/י אליהם):',
  profileSaved:'✅ הפרופיל נשמר', profilePassSub:'שינוי סיסמה:', newPasswordPh:'סיסמה חדשה (לפחות 6 תווים)',
  profilePassSave:'לעדכן סיסמה', passwordUpdated:'✅ הסיסמה עודכנה', editProfile:'✏️ עריכת פרופיל',
},
en: {
  appName:'CartSync', tagline:'One shopping list, for the whole family', langLabel:'Language',
  authHero:'One shopping list, for the whole family',
  authSub:'Add, check off, and see it live for everyone — even when you split up around the store.',
  login:'Log in', signup:'Sign up', name:'Your name', email:'Email', password:'Password (6+ characters)',
  loginGo:'Log in', signupGo:'Create account', forgot:'Forgot password', resetGo:'Send reset link',
  resetSent:'📬 We sent an email with a link to set a new password.',
  onboardTitle:'Shopping for who?', onboardSub:'Create a household, or join one with an invite code.',
  createHh:'New household', hhNamePh:'e.g. Our home', create:'Create',
  joinHh:'I have an invite code', codePh:'Invite code', join:'Join',
  itemPh:'Add an item…', qtyPh:'Qty', add:'Add',
  pendingTitle:'Needs approval', boughtTitle:'Bought', emptyList:'The list is empty. What are we out of?',
  activityTitle:'Activity history', activityEmpty:'No activity on this list yet',
  actAdded:'{n} added: {t}', actRequested:'{n} requested to add: {t}', actApproved:'{n} approved: {t}',
  actRejected:'{n} rejected: {t}', actChecked:'{n} collected: {t}', actUnchecked:'{n} un-collected: {t}', actDeleted:'{n} removed: {t}',
  invite:'Invite someone', inviteSub:'Anyone with this code or link can join within 7 days.',
  inviteRole:'Role for new members:', inviteCopy:'Copy code', inviteCopied:'📋 Copied',
  inviteShare:'📤 Share invite link', inviteShareText:'Join us on "CartSync" to manage our shopping list together:',
  joinedViaLink:'✅ You joined the household!',
  roleOwner:'Household head', roleEditor:'Full editor', roleRequester:'Can request items', roleViewer:'View only',
  members:'Household members', signOut:'Sign out', deleteAccount:'Delete account', syncNow:'Sync now',
  settings:'Settings', language:'Language', switchHousehold:'Switch household',
  itemAdded:'✅ Added to the list', itemRequested:'🙋 Request sent for approval', itemApproved:'✅ Approved',
  confirmDelete:'Remove from the list?', yes:'Yes', cancel:'Cancel',
  offline:'📴 No connection right now. Changes will sync once you\'re back online.',
  errGeneric:'Something went wrong, try again.',
  errInvite:'That invite code is invalid or expired.',
  needHhName:'Give the household a name', needCode:'Enter a code',
  versionLabel:'Version: {v}', updateAvailable:'Update available', updateNow:'🔄 Update',
  updateDownloading:'Downloading...', updateFailed:'Update failed, try again', updateDone:'✅ Installed',
  themeLabel:'Appearance', themeLight:'☀️ Light', themeDark:'🌙 Dark', themeSystem:'⚙️ Auto',
  addedBy:'Added by {n}', checkedBy:'Collected by {n}',
  tripActive:'Shopping trip in progress', tripClose:'✅ Finish shopping', tripCloseTitle:'Finish this shopping trip?',
  tripCloseBody:'The list will close and move to history, including anything not yet taken. You can always start a new list.',
  tripCloseBodyEmpty:'Everything on the list was collected. The list will close and move to history.',
  tripCloseBodyUnchecked:'{n} items were not collected. What should happen to them?',
  tripLeave:'Leave them in the closed list', tripMoveExisting:'Move to another open list', tripMoveNew:'Move to a new list',
  tripClosed:'✅ List closed', boughtHeader:'Collected', notBoughtHeader:'Still needed',
  homeSub:'All of your household\'s shared lists, in one place.',
  homeLists:'My lists', homeInvite:'Invite a family member', homeSwitch:'Switch household',
  listsTitle:'My lists', listsOpenTitle:'Active', listsClosedTitle:'History',
  listsEmpty:'No active lists yet. Create one?', newListTitle:'New list', newListName:'List name (e.g. Saturday shopping)',
  newListGo:'Create and open', needListName:'Give the list a name',
  itemsCount:'{n} items', closedOn:'Closed {d}',
  deleteList:'🗑️ Delete', deleteListTitle:'Delete list', deleteListConfirm:'Permanently delete the list "{n}"? This cannot be undone.', listDeleted:'🗑️ List deleted',
  notifyListOpened:'🛒 {n} opened a new list: {l}', notifyListClosed:'✅ {n} finished shopping in {l}',
  undo:'↩️ Undo', deleted:'🗑️ Deleted', editItem:'Edit item', editSave:'Save',
  fontSizeLabel:'Text size', fontNormal:'Normal', fontLarge:'Large', fontXlarge:'Extra large',
  searchPh:'Search the list…', newPendingToast:'🙋 {n} requested to add: {t}',
  dupWarning:'"{n}" is already on the list.', dupAddAnyway:'Add anyway',
  manageMembers:'👥 Manage household members', membersTitle:'Household members',
  removeConfirm:'Remove {n} from the household?', leaveConfirm:'Leave this household?',
  removeTitle:'Remove member', leaveTitle:'Leave household', removeAction:'Remove', leaveAction:'Leave',
  leaveHousehold:'Leave household', memberRemoved:'✅ Removed from the household', youLeft:'👋 You left the household',
  transferOwnerAction:'Transfer ownership', transferOwnerTitle:'Transfer household ownership',
  transferOwnerConfirm:'Transfer ownership of the household to {n}? You will become an editor, and {n} will have full owner control.',
  ownerTransferred:'👑 Ownership transferred',
  roleUpdated:'✅ Role updated', you:'(you)',
  editNameTitle:'Name in this household', editNameSub:'How your name shows to others in this household. You can set a different name per household.',
  nameUpdated:'✅ Name updated',
  profileTitle:'Edit profile', profileNameSub:'Your name (default for new households you join):',
  profileSaved:'✅ Profile saved', profilePassSub:'Change password:', newPasswordPh:'New password (6+ characters)',
  profilePassSave:'Update password', passwordUpdated:'✅ Password updated', editProfile:'✏️ Edit profile',
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

  let theme = 'system';
  try{ theme = localStorage.getItem('cs-theme') || 'system'; }catch(e){}
  if(theme!=='light'&&theme!=='dark'&&theme!=='system') theme='system';

  let fontSize = 'normal';
  try{ fontSize = localStorage.getItem('cs-fontsize') || 'normal'; }catch(e){}
  if(fontSize!=='normal'&&fontSize!=='large'&&fontSize!=='xlarge') fontSize='normal';

  function apply(){
    document.documentElement.lang = lang;
    document.documentElement.dir = lang==='he' ? 'rtl' : 'ltr';
    if(theme==='system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-fontsize', fontSize);
  }
  function setTheme(t){
    theme = (t==='light'||t==='dark') ? t : 'system';
    try{ localStorage.setItem('cs-theme', theme); }catch(e){}
    apply();
  }
  function setFontSize(s){
    fontSize = (s==='large'||s==='xlarge') ? s : 'normal';
    try{ localStorage.setItem('cs-fontsize', fontSize); }catch(e){}
    apply();
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
  Object.assign(window.CS,{t,lang:()=>lang,setLang,theme:()=>theme,setTheme,fontSize:()=>fontSize,setFontSize,authErr,CATS,CAT_ORDER});
})();
