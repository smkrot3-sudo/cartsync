package il.cartsync.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final String SITE = "https://smkrot3-sudo.github.io/cartsync/";
    private static final long STALE_AFTER_MS = 3 * 60 * 1000; // reload if the app sat in the background longer than this
    private WebView webView;
    private long pausedAt = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        webView.addJavascriptInterface(new Bridge(), "CartApp");
        webView.setWebViewClient(new WebViewClient());

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack();
                else { setEnabled(false); getOnBackPressedDispatcher().onBackPressed(); }
            }
        });

        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl(SITE);
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
