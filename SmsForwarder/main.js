/*
 * @Description: the core of SMS Forwarder
 * @Version: 1.1.0.20211013
 * @Author: Arvin Zhao
 * @Date: 2021-10-03 15:10:01
 * @Last Editors: Arvin Zhao
 * @LastEditTime: 2021-10-13 22:42:59
 */

"ui"; // Enable the UI mode of Auto.js Pro.

importClass(android.content.ContentValues);
importClass(android.database.ContentObserver);
importClass(android.net.Uri);

const CONFIG = require("./config.json");
const GONE = 8
const HIDE_LOGS = "Hide logs"
const SHOW_LOGS = "Show logs"
const VISIBLE = 0
var storage = storages.create("ArvinZJC:SmsForwarder")
var smsObserver = null;

/**
 * Show and change settings if applicable.
 */
function changeSettings() {
    var tgUserId = storage.get("tgUserId");
    rawInput("Enter your Telegram user ID", tgUserId).then(input => {
        input = input.trim()

        if (tgUserId !== input) {
            storage.put("tgUserId", input);
            log("TG user ID configured.")
        } // end if
    });
} // end function changeSettings

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
    if (storage.contains("tgUserId")) {
        var tgUserId = storage.get("tgUserId");

        if (tgUserId === "") {
            log("Invalid TG user ID.")
        }
        else {
            threads.start(function() {
                try {
                    var r = http.get("https://api.telegram.org/bot" + CONFIG.tgBotToken + "/sendMessage?chat_id=" + tgUserId + "&parse_mode=HTML&text=" + msg);
    
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
        } // end if...else
    }
    else {
        log("No TG user ID configured.")
    } // end if...else
} // end function forwardSms

/**
 * Read the new SMS message.
 * @returns a string containing the sender and the content of the new SMS message or `null` if no new SMS message is found
 */
function readSms() {
    var cursor = context.getContentResolver().query(
        Uri.parse("content://sms/inbox"),
        null,
        null,
        null,
        "date desc"
    );
    
    if (cursor !== null && cursor.count > 0) {
        cursor.moveToFirst();

        var msg = util.format(
            "<b>From: %s</b>\%0a%s",
            cursor.getString(cursor.getColumnIndex("address")),
            cursor.getString(cursor.getColumnIndex("body"))
        );
        
        cursor.close();
        log("New SMS message read.");
        return msg;
    }
    else {
        return null;
    } // end if...else
} // end function readSms

/**
 * Show the button log for showing/hiding logs accordingly.
 */
function showBtnLog() {
    if (ui.btnLog.getVisibility() === GONE) {
        ui.btnLog.setVisibility(VISIBLE);
        toast("Dev mode enabled.");
    }
    else {
        ui.btnLog.setVisibility(GONE);
        toast("Dev mode disabled.");
    } // end if...else
} // end function showBtnLog

/**
 * Show logs.
 */
function showLogs() {
    if (!$floaty.checkPermission()) {
        log("Failed to show a floating window due to no permission. Ask for the permission.");
        $floaty.requestPermission();
        exit();
    }
    else {
        if (ui.btnLog.getText() === SHOW_LOGS) {
            console.show();
            ui.btnLog.setText(HIDE_LOGS);
        }
        else {
            console.hide();
            ui.btnLog.setText(SHOW_LOGS);
        } // end if...else
    } // end if...else
} // end function showLogs

/**
 * Start the SMS observer.
 */
function startObserver() {
    if (!$power_manager.isIgnoringBatteryOptimizations()) {
        log("Battery optimisation enabled. Ask for disabling it.");
        toast("Please disable the battery optimisation on the app to ensure the service.");
        $power_manager.requestIgnoreBatteryOptimizations();
    } // end if
    
    smsObserver = new JavaAdapter(
        ContentObserver,
        {
            // It is expected to only react to SMS data changes from [content://sms/raw] (e.g., [content://sms/101]).
            onChange: (_, uri) => {
                uri = uri.toString();
                log("SMS data changes detected from URI: " + uri);

                // Avoid repeated reaction to the SMS data changes. "[]" is necessary.
                if (uri === "[content://sms]" || uri === "[content://sms/inbox]") {
                    return;
                } // end if
                
                var msg = readSms();

                if (msg !== null && CONFIG.hasOwnProperty("tgBotToken")) {
                    forwardSms(msg);
                }
                else {
                    log("Failed to start to forward the new SMS message. Null message or unconfigured TG bot token.")
                } // end if...else
            }
        },
        new android.os.Handler()
    );
    context.getContentResolver().registerContentObserver(
        Uri.parse("content://sms"),
        true,
        smsObserver
    );
    log("SMS observer started.");
} // end function startObserver

$settings.setEnabled("foreground_service", true); // Enable the foreground service to keep the app alive.

ui.layoutFile("res/layout/home.xml");
ui.toolbarApp.on("long_click", showBtnLog);
ui.txtTg.setText("3. Please add the Telegram (TG) bot named \"" + CONFIG.tgBotName + "\" (" + CONFIG.tgBotLink + "). You should also click the gear button at the bottom to enter your TG user ID to enable TG message forwarding. You can search on the web for the way to get your user ID.")
ui.btnLog.setText(SHOW_LOGS);
ui.btnLog.on("click", showLogs);
ui.fabSettings.on("click", changeSettings);
ui.run(startObserver);

events.on("exit", endObserver);