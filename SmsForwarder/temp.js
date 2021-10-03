"ui";

importClass(android.net.Uri);
importClass(android.database.ContentObserver);
let resume = true;
let pause = false;
ui.layout(
  <vertical>
    <button id="btn">点击打开AutoJsPro简介</button>
    <text text="短信监听测试" textSize="30sp" textStyle="bold" gravity="center" w="*" margin="30"></text>
    <text
      text="--来自AutoJsPro教程"
      textSize="22sp"
      w="*"
      textStyle="italic"
      gravity="right"
      marginRight="10"
      marginBottom="20"
    ></text>
    <horizontal>
      <button id="开启短信监听" layout_width="0dp" layout_weight="1">
        开启短信监听
      </button>
      <button id="关闭短信监听" layout_width="0dp" layout_weight="1">
        关闭短信监听
      </button>
    </horizontal>
    <button id="退出">退出</button>
    <text text="10086 10010 和 平台验证码, 一般都属于通知短信, 小米默认拒绝第三方应用读取"></text>
    <horizontal>
      <button id="给10086发短信" layout_width="0dp" layout_weight="1">
        给10086发短信
      </button>
      <button id="给10010发短信" layout_width="0dp" layout_weight="1">
        给10010发短信
      </button>
    </horizontal>
    <text text="备注: 发短信按钮只是打开发短信界面, 需要用户输入短信内容, 不会代替客户操作, 安全放心"></text>

    <text text="短信内容:" textSize="25sp"></text>
    <text id="messageToDisplay"></text>
  </vertical>
);
let smsObserver = null;
let queue = [];
function querySms() {
  runtime.requestPermissions(["read_sms"]);
  let cursor = context
    .getContentResolver()
    .query(Uri.parse(java.lang.String("content://sms/inbox")), null, null, null, "date desc");
  if (cursor != null && cursor.count > 0) {
    log(cursor.count);
    //有未读短信
    cursor.moveToFirst();
    let address = cursor.getString(cursor.getColumnIndex("address"));
    let body = cursor.getString(cursor.getColumnIndex("body"));
    log(cursor.getString(cursor.getColumnIndex("_id")));
    log(address);
    log(body);
    log("smsObserver =");
    log(smsObserver);
    cursor.close();
    log("取消监听 开始");
    let msg = util.format("发短信的号码: %s, 短信内容: %s", address, body);
    ui.messageToDisplay.setText(msg);
    context.getContentResolver().unregisterContentObserver(smsObserver);
    smsObserver = null;
    log("取消监听 结束");
  } else {
    log("没有符合条件的短信");
  }
}

let onChangeFunction = function () {
  log("监听事件函数 onChangeFunction");
  log("resume = " + resume, "pause = " + pause);
  if (resume === true && pause === false) {
    log("app在前台, 清空队列");
    queue = [];
    try {
      querySms();
    } catch (e) {
      log(e && e.stack);
      try {
        querySms();
      } catch (e) {
        log(e && e.stack);
      }
    }
  } else {
    // 回到app主界面再查询数据, 否则app处于后台, 申请权限不可见, 会报错
    log("app不在前台, 先加入队列, app回到前台后再处理队列");
    queue.push(1);
  }
};
function createSmsObserver() {
  let smsObserver = new JavaAdapter(
    ContentObserver,
    {
      onChange: onChangeFunction,
    },
    new android.os.Handler()
  );
  return smsObserver;
}
ui.开启短信监听.click(function () {
  toastLog("开启短信监听");
  smsObserver = createSmsObserver();
  context.getContentResolver().registerContentObserver(Uri.parse("content://sms"), true, smsObserver);
});
ui.关闭短信监听.click(function () {
  toastLog("关闭短信监听");
  if (smsObserver) {
    context.getContentResolver().unregisterContentObserver(smsObserver);
  }
});
ui.退出.click(function () {
  toastLog("退出");
  if (smsObserver) {
    context.getContentResolver().unregisterContentObserver(smsObserver);
  }
  engines.myEngine().forceStop();
});

events.on("exit", function () {
  log("退出事件");
  if (smsObserver) {
    log("取消监听");
    context.getContentResolver().unregisterContentObserver(smsObserver);
  }
});

ui.给10086发短信.click(function () {
  toastLog("给10086发短信");
  let uri = Uri.parse("smsto:" + 10086);
  let intentMessage = new Intent(Intent.ACTION_VIEW, uri);
  activity.startActivity(intentMessage);
});
ui.给10010发短信.click(function () {
  toastLog("给10010发短信");
  let uri = Uri.parse("smsto:" + 10010);
  let intentMessage = new Intent(Intent.ACTION_VIEW, uri);
  activity.startActivity(intentMessage);
});

// 当用户回到本界面时，resume事件会被触发
ui.emitter.on("resume", function () {
  log("resume");
  resume = true;
  pause = false;
  log("queue =");
  log(queue);
  if (queue.length > 0) {
    log("app在回到主界面, 清空队列");
    queue = [];
    try {
      querySms();
    } catch (e) {
      log(e && e.stack);
      try {
        querySms();
      } catch (e) {
        log(e && e.stack);
      }
    }
  }
});
// 当用户回到本界面时，resume事件会被触发
ui.emitter.on("pause", function () {
  log("pause");
  pause = true;
  resume = false;
});

ui.btn.click(function () {
  let str =
    "104,116,116,112,115,58,47,47,109,112,46,119,101,105,120,105,110,46,113,113,46,99,111,109,47,115,47,69,102,65,97,100,118,108,82,105,106,104,105,98,100,87,114,89,108,73,90,68,65";
  let url = unEncryptionCode(str);
  app.openUrl(url);
});

function unEncryptionCode(str) {
  var k = str.split(",");
  var rs = "";
  for (var i = 0; i < k.length; i++) {
    rs += String.fromCharCode(k[i]);
  }
  return rs;
}