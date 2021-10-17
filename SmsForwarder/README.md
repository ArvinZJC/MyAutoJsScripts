![banner.png](./banner.png)

# [MyAutoJsScripts](../../..)/SmsForwarder

**English** | [简体中文](./README-zhCN.md)

I have got an iPhone using dual SIM with an eSIM. The problem is that I own 2 SIM cards, and that I prefer receiving SMS messages on my iPhone. Hence, there is a requirement to forward SMS messages received on my Android phone to iPhone. SMS Forwarder is a simple Android tool to forward the messages to a Telegram (TG) bot.

## ❗ ATTENTION

> May I have your attention pls? 🔥

1. App contents are displayed in English.
2. You could directly use the tool by downloading the APK file from the [Releases](../../releases) section. All you need to do is to follow the instructions shown in the app, including but not limited to granting the SMS permission and starting the TG bot named [Steve Jobz](https://t.me/arvinzjc_notifications_bot) for your TG account.
3. You could also build the APK file yourself, as long as you have got an Auto.js Pro account. You need to create your `config.json` file in the root directory of SMS Forwarder with the following contents.

    ```JSON
    {
        "tgBotLink": "<your TG bot link like https://t.me/...>",
        "tgBotName": "<your TG bot name>",
        "tgBotToken": "<your TG bot token>"
    }
    ```
