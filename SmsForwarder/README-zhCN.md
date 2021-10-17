![banner.png](./banner.png)

# [MyAutoJsScripts](../../..)/SmsForwarder

[English](./README.md) | **简体中文**

由于我手里的苹果手机支持的双卡是一 SIM 一 eSIM ，但我有2个 SIM 卡，这就导致我需要将插在安卓手机上的 SIM 卡接收到的短信转发到苹果手机上。SMS Forwarder 就是这样一个安卓小工具， 它可以将短信内容转发到指定的电报机器人中。

## ❗ 注意

> 敲黑板了！敲黑板了！🔥

1. 这个应用支持的语言仅有 English。
2. 您可以通过从[发行](../../releases)部分下载 APK 安装包来直接使用这个工具。您只需要按应用内的提示操作即可，比如授予短信权限和为您的电报账户启动一个叫 [Steve Jobz](https://t.me/arvinzjc_notifications_bot) 的机器人。
3. 您也可以自己构建 APK 安装包，只要您有 Auto.js Pro 账号。您需要在 SMS Forwarder 的项目根目录下创建 `config.json` 文件，并添加以下内容。

    ```JSON
    {
        "tgBotLink": "<your TG bot link like https://t.me/...>",
        "tgBotName": "<your TG bot name>",
        "tgBotToken": "<your TG bot token>"
    }
    ```
