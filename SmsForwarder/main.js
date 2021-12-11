/*
 * @Description: the core of SMS Forwarder
 * @Version: 1.5.1.20211211
 * @Author: Arvin Zhao
 * @Date: 2021-10-03 15:10:01
 * @Last Editors: Arvin Zhao
 * @LastEditTime: 2021-12-11 13:46:43
 */

"ui"; // Enable the UI mode of Auto.js Pro.

importClass(android.content.ContentValues);
importClass(android.database.ContentObserver);
importClass(android.net.Uri);
importClass(android.os.Process);

const CONFIG = require("./config.json");
const END_OBSERVER = "End observer";
const GONE = 8;
const HIDE_LOGS = "Hide log console";
const IS_DEV = "isDev"; // The key of the storage value indicating if the dev mode is enabled.
const OBSERVER_ON = "observerOn"; // The key of the storage value indicating if the SMS observer is on (for reference).
const SHOW_LOGS = "Show log console";
const START_OBSERVER = "Start observer";
const TG_USER_ID = "tgUserId"; // The key of the storage value containing the TG user ID.
const VISIBLE = 0;
var storage = storages.create("ArvinZJC:SmsForwarder");
var smsObserver = null;

/**
 * Add the date and time to the log message.
 * @returns the date and time prefix.
 */
function addTimePrefix() {
  var datetime = new Date();
  return (
    datetime.getFullYear() +
    "/" +
    ("0" + (datetime.getMonth() + 1)).slice(-2) +
    "/" +
    ("0" + datetime.getDate()).slice(-2) +
    " " +
    ("0" + datetime.getHours()).slice(-2) +
    ":" +
    ("0" + datetime.getMinutes()).slice(-2) +
    ":" +
    ("0" + datetime.getSeconds()).slice(-2) +
    " - "
  );
} // end function addTimePrefix

/**
 * Show and change settings if applicable.
 */
function changeSettings() {
  var tgUserId = storage.get(TG_USER_ID);
  rawInput("Enter your Telegram user ID", tgUserId).then((input) => {
    input = input.trim();

    if (tgUserId !== input) {
      storage.put(TG_USER_ID, input);
      console.log(addTimePrefix() + "TG user ID configured.");
    } // end if
  });
} // end function changeSettings

/**
 * End the SMS observer.
 */
function endObserver() {
  if (smsObserver === null) {
    console.warn(
      addTimePrefix() +
        "Failed to get the SMS observer. Perhaps the script is ended before ending the observer manually."
    );
    toast("Please force stop the app to ensure ending the observer.");
    console.log(
      addTimePrefix() +
        "Start to stop the app to try to reset the SMS observer."
    );
    Process.killProcess(Process.myPid());
  } else {
    context.getContentResolver().unregisterContentObserver(smsObserver);

    var log = "SMS observer ended.";

    toast(log);
    console.log(addTimePrefix() + log);
  } // end if...else
} // end function endObserver

/**
 * Forward the new SMS message.
 * @param {String} msg a string containing the sender and the content of the new SMS message
 */
function forwardSms(msg) {
  if (storage.contains(TG_USER_ID)) {
    var tgUserId = storage.get(TG_USER_ID);

    if (tgUserId === "") {
      console.warn(
        addTimePrefix() +
          "Failed to forward the new SMS message. Invalid TG user ID."
      );
    } else {
      threads.start(function () {
        try {
          var r = http.get(
            "https://api.telegram.org/bot" +
              CONFIG.tgBotToken +
              "/sendMessage?chat_id=" +
              tgUserId +
              "&parse_mode=HTML&text=" +
              msg
          );

          if (r.statusCode === 200) {
            var log = "New SMS message forwarded to TG.";

            toast(log);
            console.log(addTimePrefix() + log);
          } else {
            console.warn(addTimePrefix() + r);
          } // end if...else
        } catch (e) {
          console.warn(
            addTimePrefix() + "Failed to forward the new SMS message."
          );
          console.error(e);
        } // end try...catch
      });
    } // end if...else
  } else {
    console.warn(addTimePrefix() + "No TG user ID configured.");
  } // end if...else
} // end function forwardSms

/**
 * Show/Hide the dev mode area.
 */
function manageDev() {
  if (ui.verticalDev.getVisibility() === GONE) {
    storage.put(IS_DEV, true);
    ui.verticalDev.setVisibility(VISIBLE);
    toast("Dev mode enabled.");
  } else {
    storage.put(IS_DEV, false);
    ui.verticalDev.setVisibility(GONE);
    toast("Dev mode disabled.");
  } // end if...else
} // end function manageDev

/**
 * Show/Hide the log console.
 */
function manageLogConsole() {
  if (!$floaty.checkPermission()) {
    console.warn(
      addTimePrefix() +
        "Failed to show a floating window due to no permission. Ask for the permission."
    );
    toast("Please allow displaying over other apps.");
    $floaty.requestPermission();
    exit();
  } else {
    if (ui.btnLog.getText() === SHOW_LOGS) {
      console.show();
      ui.btnLog.setText(HIDE_LOGS);
    } else {
      console.hide();
      ui.btnLog.setText(SHOW_LOGS);
    } // end if...else
  } // end if...else
} // end function manageLogConsole

/**
 * Start/End the SMS observer.
 */
function manageObserver() {
  if (ui.btnObserver.getText() === START_OBSERVER) {
    storage.put(OBSERVER_ON, true);
    ui.btnObserver.setText(END_OBSERVER);
    startObserver();
  } else {
    storage.put(OBSERVER_ON, false);
    ui.btnObserver.setText(START_OBSERVER);
    endObserver();
  } // end if...else
} // end function manageObserver

/**
 * Read the new SMS message.
 * @returns a string containing the sender and the content of the new SMS message or `null` if no new SMS message is found
 */
function readSms() {
  var cursor = context
    .getContentResolver()
    .query(Uri.parse("content://sms/inbox"), null, null, null, "date desc");

  if (cursor != null && cursor.count > 0) {
    cursor.moveToFirst();

    var msg = util.format(
      "<b>From: %s</b>%0a%s",
      cursor.getString(cursor.getColumnIndex("address")),
      cursor.getString(cursor.getColumnIndex("body"))
    );

    cursor.close();
    console.log(addTimePrefix() + "New SMS message read.");
    return msg;
  } else {
    return null;
  } // end if...else
} // end function readSms

/**
 * Show full logs.
 */
function showFullLogs() {
  if (ui.btnObserver.getText() === END_OBSERVER) {
    confirm(
      "The SMS observer must be ended before showing full logs. Are you sure of ending the server?"
    ).then((yes) => {
      if (yes) {
        storage.put(OBSERVER_ON, false);
        ui.btnObserver.setText(START_OBSERVER);
        endObserver();
        app.startActivity("console");
      } // end if
    });
  } else {
    app.startActivity("console");
  } // end if...else
} // end showFullLogs

/**
 * Start the SMS observer.
 */
function startObserver() {
  if (!$power_manager.isIgnoringBatteryOptimizations()) {
    console.warn(
      addTimePrefix() + "Battery optimisation enabled. Ask for disabling it."
    );
    toast(
      "Please disable the battery optimisation on the app to ensure the service."
    );
    $power_manager.requestIgnoreBatteryOptimizations();
  } // end if

  smsObserver = new JavaAdapter(
    ContentObserver,
    {
      onChange: (_, uri) => {
        uri = uri.toString();
        console.log(
          addTimePrefix() + "SMS data changes detected from URI: " + uri
        );

        // It is expected to only react to SMS data changes from [content://sms/<num>] (e.g., [content://sms/1]).
        if (/^\[content:\/\/sms\/\d+\]$/.test(uri)) {
          var msg = readSms();

          if (msg === null) {
            console.warn(
              addTimePrefix() +
                "Failed to start to forward the new SMS message. Null message."
            );
          } else if (!CONFIG.hasOwnProperty("tgBotToken")) {
            console.warn(
              addTimePrefix() +
                "Failed to start to forward the new SMS message. Unconfigured TG bot token."
            );
          } else {
            forwardSms(msg);
          } // end nested if...else
        } // end if
      },
    },
    new android.os.Handler()
  );
  context
    .getContentResolver()
    .registerContentObserver(Uri.parse("content://sms"), true, smsObserver);

  var log = "SMS observer started.";

  toast(log);
  console.log(addTimePrefix() + log);
} // end function startObserver

$settings.setEnabled("foreground_service", true); // Enable the foreground service to keep the app alive.
$settings.setEnabled("stop_all_on_volume_up", false); // Disable stopping all the scripts on pressing the volume up button.
ui.layoutFile("res/layout/home.xml");

if (storage.contains(OBSERVER_ON)) {
  if (storage.get(OBSERVER_ON)) {
    ui.btnObserver.setText(END_OBSERVER);
  } else {
    ui.btnObserver.setText(START_OBSERVER);
  } // end if...else
} else {
  storage.put(OBSERVER_ON, false);
  ui.btnObserver.setText(START_OBSERVER);
} // end if...else

if (storage.contains(IS_DEV)) {
  if (storage.get(IS_DEV)) {
    ui.verticalDev.setVisibility(VISIBLE);
  } else {
    ui.verticalDev.setVisibility(GONE);
  } // end if...else
} else {
  storage.put(IS_DEV, false);
  ui.verticalDev.setVisibility(GONE);
} // end if...else

ui.toolbarApp.on("long_click", manageDev);
ui.txtTg.setText(
  '2. Please start the Telegram (TG) bot named "' +
    CONFIG.tgBotName +
    '" (' +
    CONFIG.tgBotLink +
    ") for your TG account. You should also click the gear button at the bottom to enter your TG user ID to enable message forwarding. You can search on the web for the way to get the ID."
);
ui.btnObserver.on("click", manageObserver);
ui.btnLog.setText(SHOW_LOGS);
ui.btnLog.on("click", manageLogConsole);
ui.btnFullLogs.on("click", showFullLogs);
ui.fabSettings.on("click", changeSettings);
