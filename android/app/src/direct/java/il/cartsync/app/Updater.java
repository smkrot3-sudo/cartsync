package il.cartsync.app;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.widget.Toast;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** In-app update: download the new APK and hand it to Android's installer (no browser, no Downloads folder). */
public class Updater extends BroadcastReceiver {
    interface Progress { void on(int percent); void fail(String why); }

    static void install(final Context c, final String url, final Progress p) {
        new Thread(new Runnable() { public void run() {
            PackageInstaller.Session s = null;
            try {
                HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
                h.setConnectTimeout(20000); h.setReadTimeout(30000); h.setUseCaches(false);
                long total = h.getContentLength();
                PackageInstaller pi = c.getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                params.setAppPackageName(c.getPackageName());
                int id = pi.createSession(params);
                s = pi.openSession(id);
                InputStream in = h.getInputStream();
                OutputStream out = s.openWrite("update.apk", 0, total > 0 ? total : -1);
                byte[] buf = new byte[65536]; long done = 0; int n, last = -1;
                while ((n = in.read(buf)) > 0) {
                    out.write(buf, 0, n); done += n;
                    int pct = total > 0 ? (int) (done * 100 / total) : -1;
                    if (pct != last) { last = pct; p.on(pct); }
                }
                s.fsync(out); out.close(); in.close();
                Intent i = new Intent(c, Updater.class).setAction("il.cartsync.INSTALLED");
                // the system fills in the result, so this one must be mutable (FLAG_MUTABLE on Android 12+)
                int flags = PendingIntent.FLAG_UPDATE_CURRENT | (android.os.Build.VERSION.SDK_INT >= 31 ? 0x02000000 : 0);
                s.commit(PendingIntent.getBroadcast(c, 7, i, flags).getIntentSender());
                s.close();
                p.on(100);
            } catch (Exception e) {
                if (s != null) try { s.abandon(); } catch (Exception x) { }
                p.fail(String.valueOf(e.getMessage()));
            }
        } }).start();
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, -999);
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            // Android asks the person to confirm the update (and, the first time, to allow updates from this app)
            Intent confirm = (Intent) intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirm != null) { confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); c.startActivity(confirm); }
        } else if (status != PackageInstaller.STATUS_SUCCESS) {
            Toast.makeText(c, "העדכון לא הותקן. אפשר לנסות שוב מתוך האפליקציה.", Toast.LENGTH_LONG).show();
        }
    }
}
