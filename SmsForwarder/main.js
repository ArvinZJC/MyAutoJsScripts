/*
 * @Description: the core of SMS Forwarder
 * @Version: 1.0.0.20211003
 * @Author: Arvin Zhao
 * @Date: 2021-10-03 15:10:01
 * @Last Editors: Arvin Zhao
 * @LastEditTime: 2021-10-03 19:07:56
 */

"ui";

importClass(android.database.ContentObserver);
importClass(android.net.Uri);

const BOT_TOKEN = "2005164021:AAFFGEy5aK_L8xGgBl_g-CAzEFCtOq02Du0"; // The corresponding Telegram bot token.
var smsObserver = null;

/**
 * End the SMS observer.
 */
function endObserver() {
    if (smsObserver !== null) {
        context.getContentResolver().unregisterContentObserver(smsObserver);
        log("SMS observer ended.");
    } // end if
} // end function endObserver

/**
 * Forward the new SMS message.
 * @param {String} msg a string containing the sender and the content of the new SMS message
 */
function forwardSms(msg) {
    var tgUserId = String(ui.tgUserId.getText()).trim()
    
    if (tgUserId !== null) {
        threads.start(function() {
            try {
                var r = http.get("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage?chat_id=" + tgUserId + "&text=" + msg);

                if (r.statusCode === 200) {
                    toastLog("New SMS message forwarded to TG.");
                }
                else {
                    log(r);
                } // end if...else
            }
            catch (e) {
                log("Failed to forward the new SMS message.");
                log(e);
            } // end try...catch
        });
        

        
    } // end if
} // end function forwardSms

/**
 * Read the new SMS message.
 * @returns a string containing the sender and the content of the new SMS message or `null` if no new SMS message is found
 */
function readSms() {
    var cursor = context.getContentResolver().query(
        Uri.parse(java.lang.String("content://sms/inbox")),
        null,
        null,
        null,
        "date desc"
    );
    
    if (cursor !== null && cursor.count > 0) {
        cursor.moveToFirst();

        var msg = util.format(
            "From: %s\n%s",
            cursor.getString(cursor.getColumnIndex("address")),
            cursor.getString(cursor.getColumnIndex("body"))
        )
        
        cursor.close();
        log("New SMS message read.")
        return msg;
    }
    else {
        return null;
    } // end if...else
} // end function readSms

/**
 * Start the SMS observer.
 */
function startObserver() {
    smsObserver = new JavaAdapter(
        ContentObserver,
        {
            onChange: () => {
                var msg = readSms();

                if (msg !== null) {
                    forwardSms(msg);
                } // end if
            }
        },
        new android.os.Handler()
    );
    context.getContentResolver().registerContentObserver(
        Uri.parse("content://sms"),
        true,
        smsObserver
    );
    log("SMS observer started.")
} // end function startObserver

ui.layoutFile("res/layout/home.xml");
ui.run(startObserver); // TODO: check permission and internet connection?
events.on("exit", endObserver);