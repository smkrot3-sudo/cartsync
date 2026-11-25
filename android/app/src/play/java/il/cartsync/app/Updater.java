package il.cartsync.app;

import android.content.Context;

/** Google Play build: the store updates the app, so self-updating is switched off entirely. */
public class Updater {
    interface Progress { void on(int percent); void fail(String why); }

    static void install(Context c, String url, Progress p) { p.fail("updates come from Google Play"); }
}
