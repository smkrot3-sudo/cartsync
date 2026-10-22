package il.cartsync.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    private static final String SITE = "https://smkrot3-sudo.github.io/cartsync/";
    private static final long STALE_AFTER_MS = 45 * 1000; // reload if the app sat in the background longer than this
    private WebView webView;
    private long pausedAt = 0;
    private String pendingAuth = null; // window.onAndroidAuth(...) call waiting for the page to be ready

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        // the WebView must hold Android focus for the keyboard to deliver keystrokes to a page field;
        // without it the keyboard can open over an input yet typing goes nowhere
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();
        webView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent e) {
                if (e.getAction() == MotionEvent.ACTION_DOWN && !v.hasFocus()) v.requestFocus();
                return false;
            }
        });

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        webView.addJavascriptInterface(new Bridge(), "CartApp");
        webView.setWebViewClient(new WebViewClient() {
            // the app's own site stays in the WebView; anything else (whatsapp:, tel:, mailto:, intent:,
            // wa.me and other outside links) goes to Android, instead of a net::ERR_UNKNOWN_URL_SCHEME page
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                if ((scheme.equals("http") || scheme.equals("https")) && SITE.startsWith(scheme + "://" + uri.getHost())) return false;
                if (scheme.equals("http") || scheme.equals("https")) {
                    if (uri.getHost() != null && uri.getHost().endsWith("supabase.co")) return false; // auth redirects
                }
                try {
                    Intent i = scheme.equals("intent") ? Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME) : new Intent(Intent.ACTION_VIEW, uri);
                    i.addCategory(Intent.CATEGORY_BROWSABLE);
                    i.setComponent(null);
                    i.setSelector(null);
                    startActivity(i);
                } catch (Exception e) {
                    // no app can open it (e.g. WhatsApp not installed): stay on the current page
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (pendingAuth != null) { view.evaluateJavascript(pendingAuth, null); pendingAuth = null; }
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack();
                else { setEnabled(false); getOnBackPressedDispatcher().onBackPressed(); }
            }
        });

        handleAuthLink(getIntent());
        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl(SITE);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (handleAuthLink(intent)) {
            pausedAt = 0; // the trip to the browser must not trigger the stale-page reload, which would drop the session hand-off
            webView.evaluateJavascript(pendingAuth, null);
            pendingAuth = null;
        }
    }

    /** cartsync://auth?at=..&rt=.. from auth-return.html after Google sign-in in the browser */
    private boolean handleAuthLink(Intent intent) {
        Uri u = intent == null ? null : intent.getData();
        if (u == null || !"cartsync".equals(u.getScheme())) return false;
        String at = u.getQueryParameter("at"), rt = u.getQueryParameter("rt");
        if (at == null || rt == null || at.isEmpty() || rt.isEmpty()) return false;
        pendingAuth = "window.onAndroidAuth&&window.onAndroidAuth(" + JSONObject.quote(at) + "," + JSONObject.quote(rt) + ")";
        return true;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    // onCreate's loadUrl() only ever runs once — when Android keeps the process alive across
    // backgrounding (the common case), reopening the app just resumes the same already-loaded
    // page forever, with no new network request and so no way for a fix or a redesign to reach
    // it. Reload for real once the app has been away long enough that staying fresh matters more
    // than preserving an in-progress scroll position or an open sheet.
    @Override
    protected void onPause() {
        super.onPause();
        pausedAt = System.currentTimeMillis();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.requestFocus(); // coming back from the share sheet or the installer can leave it unfocused
        if (pausedAt > 0 && System.currentTimeMillis() - pausedAt > STALE_AFTER_MS) {
            webView.reload();
        }
    }

    private void js(final String code) {
        runOnUiThread(new Runnable() { public void run() { if (webView != null) webView.evaluateJavascript(code, null); } });
    }

    /** window.CartApp in the page */
    class Bridge {
        @JavascriptInterface public int versionCode() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; } catch (Exception e) { return 0; }
        }
        @JavascriptInterface public String versionName() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }
        @JavascriptInterface public void installUpdate(String url) {
            Updater.install(MainActivity.this, url, new Updater.Progress() {
                public void on(final int pct) { js("window.onUpdateProgress&&window.onUpdateProgress(" + pct + ")"); }
                public void fail(String why) { js("window.onUpdateProgress&&window.onUpdateProgress(-2)"); }
            });
        }
        @JavascriptInterface public void openExternal(final String url) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception e) { }
                }
            });
        }
        @JavascriptInterface public void shareText(final String text) {
            runOnUiThread(new Runnable() {
                public void run() {
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType("text/plain");
                    send.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(send, null));
                }
            });
        }
    }
}
