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
  itemPh:'שם המוצר', qtyPh:'כמות', add:'הוספה', addToListFab:'הוסף לרשימה',
  pendingTitle:'בקשות לאישור', boughtTitle:'נקנה', emptyList:'הרשימה ריקה. מה חסר בבית?',
  activityTitle:'היסטוריית פעולות', activityEmpty:'אין עדיין פעולות ברשימה',
  actAdded:'{n} הוסיף/ה: {t}', actRequested:'{n} ביקש/ה להוסיף: {t}', actApproved:'{n} אישר/ה בקשה: {t}',
  actRejected:'{n} דחה/תה בקשה: {t}', actChecked:'{n} אסף/ה: {t}', actUnchecked:'{n} ביטל/ה איסוף: {t}', actDeleted:'{n} הסיר/ה: {t}',
  invite:'הזמנת חבר/ה', inviteSub:'כל מי שמקבל את הקוד או הקישור הזה יכול להצטרף תוך 7 ימים.',
  inviteRole:'הרשאה לחברים חדשים:', inviteCopy:'להעתיק קוד', inviteCopied:'📋 הועתק',
  inviteShare:'📤 שליחת קישור הזמנה', inviteShareText:'הצטרפו אלינו ב"קניות ביחד" כדי לנהל יחד את רשימת הקניות:',
  inviteReadySub:'ההזמנה מוכנה. איך לשלוח אותה?',
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
  updateSheetBody:'גרסה חדשה של קניות ביחד מוכנה להתקנה.', updateLater:'אחר כך',
  whatsNewTitle:'מה חדש', whatsNewIntro:'כמה שיפורים שהתווספו מאז הפעם האחרונה שנכנסת:', whatsNewClose:'הבנתי',
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
  homeListsHeading:'הרשימות הפעילות', homeActivityHeading:'פעילות אחרונה', homeListsMore:'כל הרשימות ←',
  homeMembers:'משק הבית', itemsLeft:'{n} פריטים נשארו', allCollected:'הכל נאסף ✅',
  greetingMorning:'בוקר טוב{n} ☀️', greetingAfternoon:'צהריים טובים{n} 👋', greetingEvening:'ערב טוב{n} 🌆', greetingNeutral:'היי{n} 👋',
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
  deleteHousehold:'🗑️ מחיקת משק הבית', deleteHouseholdTitle:'מחיקת משק הבית',
  deleteHouseholdConfirm:'למחוק לצמיתות את משק הבית "{n}"? כל הרשימות, המוצרים וההיסטוריה של כל החברים יימחקו ולא ניתן יהיה לשחזר. פעולה זו משפיעה על כולם, לא רק עליך.',
  householdDeleted:'🗑️ משק הבית נמחק',
  ownerMustTransferFirst:'את/ה ראש/ת משק הבית — צריך להעביר בעלות למישהו אחר לפני שעוזבים, או למחוק את משק הבית.',
  roleUpdated:'✅ ההרשאה עודכנה', you:'(את/ה)',
  editNameTitle:'שם במשק הבית הזה', editNameSub:'איך שמך יוצג לשאר חברי משק הבית הזה. אפשר לקבוע שם שונה בכל משק בית.',
  nameUpdated:'✅ השם עודכן',
  profileTitle:'עריכת פרופיל', profileNameSub:'השם שלך (ברירת מחדל למשקי בית חדשים שתצטרף/י אליהם):',
  profileSaved:'✅ הפרופיל נשמר', profilePassSub:'שינוי סיסמה:', newPasswordPh:'סיסמה חדשה (לפחות 6 תווים)',
  profilePassSave:'לעדכן סיסמה', passwordUpdated:'✅ הסיסמה עודכנה', editProfile:'✏️ עריכת פרופיל',
  guideTitle:'מדריך שימוש', guideOpen:'מדריך שימוש', guideIntro:'כל מה שצריך לדעת כדי להשתמש באפליקציה.',
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
  itemPh:'Product name', qtyPh:'Qty', add:'Add', addToListFab:'Add to list',
  pendingTitle:'Needs approval', boughtTitle:'Bought', emptyList:'The list is empty. What are we out of?',
  activityTitle:'Activity history', activityEmpty:'No activity on this list yet',
  actAdded:'{n} added: {t}', actRequested:'{n} requested to add: {t}', actApproved:'{n} approved: {t}',
  actRejected:'{n} rejected: {t}', actChecked:'{n} collected: {t}', actUnchecked:'{n} un-collected: {t}', actDeleted:'{n} removed: {t}',
  invite:'Invite someone', inviteSub:'Anyone with this code or link can join within 7 days.',
  inviteRole:'Role for new members:', inviteCopy:'Copy code', inviteCopied:'📋 Copied',
  inviteShare:'📤 Share invite link', inviteShareText:'Join us on "CartSync" to manage our shopping list together:',
  inviteReadySub:'The invite is ready. How would you like to send it?',
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
  updateSheetBody:'A new version of CartSync is ready to install.', updateLater:'Later',
  whatsNewTitle:'What’s new', whatsNewIntro:'A few improvements since you were last here:', whatsNewClose:'Got it',
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
  homeListsHeading:'Active lists', homeActivityHeading:'Recent activity', homeListsMore:'All lists →',
  homeMembers:'Household', itemsLeft:'{n} items left', allCollected:'All collected ✅',
  greetingMorning:'Good morning{n} ☀️', greetingAfternoon:'Good afternoon{n} 👋', greetingEvening:'Good evening{n} 🌆', greetingNeutral:'Hey{n} 👋',
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
  deleteHousehold:'🗑️ Delete household', deleteHouseholdTitle:'Delete household',
  deleteHouseholdConfirm:'Permanently delete the household "{n}"? All lists, items and history for every member will be deleted and cannot be recovered. This affects everyone, not just you.',
  householdDeleted:'🗑️ Household deleted',
  ownerMustTransferFirst:'You’re the household owner — transfer ownership to someone else before leaving, or delete the household instead.',
  roleUpdated:'✅ Role updated', you:'(you)',
  editNameTitle:'Name in this household', editNameSub:'How your name shows to others in this household. You can set a different name per household.',
  nameUpdated:'✅ Name updated',
  profileTitle:'Edit profile', profileNameSub:'Your name (default for new households you join):',
  profileSaved:'✅ Profile saved', profilePassSub:'Change password:', newPasswordPh:'New password (6+ characters)',
  profilePassSave:'Update password', passwordUpdated:'✅ Password updated', editProfile:'✏️ Edit profile',
  guideTitle:'User guide', guideOpen:'User guide', guideIntro:'Everything you need to know to use the app.',
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
/* ordered for an actual shopping trip, not alphabetically: produce/bakery/dry-goods/non-food first,
   then the categories you want in the cart last so they spend the least time out of the fridge/freezer */
const CAT_ORDER = ['produce','bakery','pantry','beverages','snacks','household','care','baby','pet','dairy','meat','frozen','other'];

/* "what's new" — bump WHATS_NEW_VERSION and add one new entry at the END of each array whenever
   there's something worth announcing to EXISTING users (not every build, just real features).
   A brand-new user never sees this — they get the full guide instead, and are marked caught-up. */
const WHATS_NEW_VERSION = 1;
const WHATS_NEW = {
he: [
  {version:1, items:[
    'ראש האפליקציה עוצב מחדש',
    'הוספה, איסוף והסרה של מוצרים — מיידיים, בלי להמתין לרשת',
    'התראות בזמן אמת על שינויים ברשימה, וכרטיס היסטוריית פעולות מלא בכל רשימה',
    'התרעה עדינה כשמוסיפים מוצר שכבר קיים ברשימה',
    'שיפור הדיוק של ה-AI שבוחר קטגוריה ואימוג׳י למוצרים',
    'אפשר עכשיו למחוק ולעזוב משקי בית',
    'שיתוף סיכום קניות ישירות ל-WhatsApp',
    'מדריך שימוש מלא לאפליקציה, נגיש מתפריט החשבון',
  ]},
],
en: [
  {version:1, items:[
    'The app header was redesigned',
    'Adding, collecting and removing items is now instant, no more waiting on the network',
    'Real-time notifications for list changes, and a full activity history card on every list',
    'A gentle warning when adding an item that’s already on the list',
    'More accurate AI category and emoji matching for items',
    'You can now delete or leave a household',
    'Share a shopping summary straight to WhatsApp',
    'A full in-app user guide, reachable from the account menu',
  ]},
],
};

/* the in-app guide — edit here whenever a feature changes, this is the single source shown to
   both new users (automatically, once) and anyone opening it later from Settings */
const GUIDE = {
he: [
  {icon:'🏠', title:'משק בית ותפקידים', body:'כל רשימת קניות שייכת ל"משק בית" — קבוצת אנשים שקונים ביחד. לכל חבר יש תפקיד: <b>ראש/ת משק בית</b> שולט/ת בהכל כולל הזמנות ומחיקה, <b>עריכה מלאה</b> יכול/ה להוסיף ולסמן בלי אישור, <b>בקשת מוצרים</b> צריך/ה אישור של עורך לפני שהמוצר מופיע ברשימה, ו<b>צפייה בלבד</b> רואה הכל בלי לגעת. אפשר לשנות תפקיד של כל חבר מתוך "ניהול חברי משק הבית".'},
  {icon:'📋', title:'רשימות קניות', body:'במשק בית אחד אפשר לפתוח כמה רשימות (למשל "סופר שבועי" ו"בית מרקחת"). רשימה "פעילה" פתוחה להוספה וסימון; אחרי שסוגרים אותה היא עוברת ל"היסטוריה" ונשארת לקריאה בלבד.'},
  {icon:'➕', title:'הוספת מוצרים', body:'לוחצים על + ומקלידים שם מוצר. האפליקציה מנחשת קטגוריה ואימוג׳י מתאים לבד — מילון מקומי מיידי, ואם הוא לא מזהה את המוצר, AI משדרג את הסיווג ברקע תוך כמה שניות בלי לעכב את ההוספה. אם המוצר כבר ברשימה, תופיע התראה עדינה עם אפשרות להוסיף בכל זאת.'},
  {icon:'✅', title:'סימון מוצרים', body:'לוחצים על העיגול ליד המוצר, או מחליקים עליו, כדי לסמן שהוא נאסף. ליד כל מוצר רואים בקטן מי הוסיף אותו, ומוצר שנאסף מראה גם מי אסף אותו — כך כשמתפזרים בסופר כל אחד רואה מה כבר נלקח.'},
  {icon:'🙋', title:'בקשות לאישור', body:'מי שבתפקיד "בקשת מוצרים" מוסיף פריטים שממתינים לאישור בראש הרשימה. ראש משק הבית או מי שיש לו עריכה מלאה יכולים לאשר (✓) או לדחות (✕). מי שביקש יכול גם לערוך או למחוק את הבקשה שלו לפני שהיא מאושרת.'},
  {icon:'🔄', title:'סנכרון חי ואופליין', body:'כל שינוי מופיע אצל כל בני משק הבית כמעט מיידית, בלי לרענן. כשאין רשת, אפשר להמשיך להוסיף ולסמן כרגיל — הכל נשמר במכשיר ומסתנכרן אוטומטית ברגע שחוזר חיבור.'},
  {icon:'🏁', title:'סיום קניות', body:'בסיום סבב קניות לוחצים "סיום קניות". אם נשארו מוצרים שלא נאספו, האפליקציה שואלת מה לעשות איתם: להשאיר ברשימה הסגורה, להעביר לרשימה פתוחה אחרת, או לפתוח להם רשימה חדשה.'},
  {icon:'📜', title:'היסטוריית פעולות', body:'בתחתית כל רשימה יש כרטיס מתקפל שמראה מי הוסיף, אישר, אסף או הסיר כל מוצר, ובאיזו שעה בדיוק — תיעוד מלא ושקוף של כל מה שקרה ברשימה.'},
  {icon:'📤', title:'שיתוף והזמנות', body:'אפשר להזמין בני משפחה למשק הבית עם קוד או קישור, ולבחור לכל מוזמן תפקיד מראש. בתוך רשימה אפשר גם לשלוח סיכום "נאסף/חסר" ישירות ב-WhatsApp.'},
  {icon:'⚙️', title:'הגדרות אישיות', body:'מתפריט החשבון (האווטאר למעלה) אפשר לשנות ערכת נושא (בהיר/כהה/לפי המכשיר), גודל טקסט, שם תצוגה, סיסמה, ולסנכרן ידנית.'},
  {icon:'👥', title:'ניהול משק הבית', body:'ראש משק הבית יכול להעביר את הבעלות לחבר אחר, להסיר חברים, ולמחוק משק בית לצמיתות (כולל כל הרשימות וההיסטוריה שלו). כל חבר יכול לעזוב משק בית בכל עת — חוץ מראש משק הבית, שצריך קודם להעביר בעלות אם יש עוד חברים.'},
],
en: [
  {icon:'🏠', title:'Household & roles', body:'Every shopping list belongs to a "household" — a group that shops together. Each member has a role: <b>owner</b> controls everything including invites and deletion, <b>editor</b> can add and check items without approval, <b>requester</b> needs an editor to approve items before they appear on the list, and <b>viewer</b> sees everything without touching it. Change anyone’s role from "Manage household members".'},
  {icon:'📋', title:'Shopping lists', body:'One household can have several lists at once (e.g. "weekly groceries" and "pharmacy"). An "open" list accepts new items and checkmarks; once you close it, it moves to history as read-only.'},
  {icon:'➕', title:'Adding items', body:'Tap + and type an item name. The app guesses a category and emoji instantly from a local dictionary, and if it doesn’t recognize the item, AI upgrades the category in the background within seconds without ever delaying the add. If the item is already on the list, a gentle warning lets you add it anyway if you really mean to.'},
  {icon:'✅', title:'Checking items off', body:'Tap the circle next to an item, or swipe it, to mark it collected. Each item shows who added it, and a collected item also shows who collected it — so when everyone splits up in the store, everyone can see what’s already taken.'},
  {icon:'🙋', title:'Pending requests', body:'Anyone with the "requester" role adds items that wait for approval at the top of the list. The owner or any editor can approve (✓) or reject (✕). The requester can also edit or delete their own request before it’s approved.'},
  {icon:'🔄', title:'Real-time sync & offline', body:'Every change appears for the whole household almost instantly, no refresh needed. With no connection, you can keep adding and checking items as usual — everything is saved on the device and syncs automatically the moment you’re back online.'},
  {icon:'🏁', title:'Finishing a shopping trip', body:'When you’re done, tap "finish shopping". If anything is still unchecked, the app asks what to do with it: leave it in the closed list, move it to another open list, or start a new list for it.'},
  {icon:'📜', title:'Activity history', body:'A collapsible card at the bottom of every list shows who added, approved, collected or removed each item, and exactly when — a full, transparent record of everything that happened.'},
  {icon:'📤', title:'Sharing & invites', body:'Invite family members to the household with a code or link, and pick a role for them in advance. From inside a list you can also send a "collected/still needed" summary straight to WhatsApp.'},
  {icon:'⚙️', title:'Personal settings', body:'From the account menu (the avatar up top) you can change the theme (light/dark/system), text size, display name, password, and sync manually.'},
  {icon:'👥', title:'Managing the household', body:'The owner can transfer ownership to another member, remove members, and permanently delete a household (including all of its lists and history). Any member can leave at any time — except the owner, who needs to transfer ownership first if other members remain.'},
],
};

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
  Object.assign(window.CS,{t,lang:()=>lang,setLang,theme:()=>theme,setTheme,fontSize:()=>fontSize,setFontSize,authErr,CATS,CAT_ORDER,
    guide:()=>GUIDE[lang]||GUIDE.he, whatsNew:()=>WHATS_NEW[lang]||WHATS_NEW.he, whatsNewVersion:WHATS_NEW_VERSION});
})();
