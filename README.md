# listener oauth2

本系统是基于OAuth2.0协议标准构建的监听者OAuth2.0授权登录系统。第三方z主题可以在利用该服务根据的不同用户个性化推送不同的消息。

在进行监听者OAuth2.0授权登录接入之前，应先拥有一个已审核通过的主题，并获得相应的channel_id和token，然后可开始接入流程。

## 授权流程说明
监听者OAuth2.0授权登录让监听者用户使用监听者id安全登录第三方主题的应用，在监听者用户授权登录第三方主题后，第三方可以获取到用户的接口调用凭证（access_token），通过access_token可以调用一些授权接口，从而可实现获取监听者用户基本信息。

监听者OAuth2.0授权登录目前支authorization_code模式，适用于拥有server端的应用授权。该模式整体流程为：
1. 第三方发起监听者授权登录请求，监听者用户允许授权第三方主题后，监听者会重定向到第三方指定的网页，并且带上授权临时票据code参数；
2. 通过code参数加上channel_id和token等，通过API换取access_token；
3. 通过access_token进行接口调用，获取用户基本数据资源.


下面是oauth2的调用方法：

### 第一步：
**第三方首先引导用户进入以下网页：**

https://oauth2.jiantingzhe.com/authorize.html?channel_id=CHANNEL_ID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&state=STATE

**参数说明:**

参数 | 是否必须	| 说明
----|---------|----
channel_id|是      |应用唯一标识
redirect_uri|是      |重定向地址，需要进行UrlEncode
response_type|是     |填code
scope|是      |应用授权作用域，拥有多个作用域用逗号（,）分隔，目前仅填写user_id_read即可
state|否     |用于保持请求和回调的状态，授权请求后原样带回给第三方。该参数可用于防止csrf攻击（跨站请求伪造攻击），建议第三方带上该参数，可设置为简单的随机数加session进行校验

**返回说明:**
用户允许授权后，将会重定向到redirect_uri的网址上，并且带上code和state参数
redirect_uri?code=CODE&state=STATE
若用户禁止授权，则重定向后不会带上code参数，仅会带上state参数
redirect_uri?state=STATE


### 第二步：通过code获取access_token
**通过code获取access_token**
http://oauth2-api.jiantingzhe.com/access_token?channel_id=CHANNEL_ID&token=TOKEN&code=CODE&grant_type=authorization_code

**参数说明:**
参数	|是否必须	|说明
-----|------|------
channel_id|是|第三方主题id
token|是|应用密钥token
code|	是	|填写第一步获取的code参数
grant_type|	是	|填authorization_code

**返回说明:**
正确的返回：

    {
    "access_token":"ACCESS_TOKEN",
    "expires_at":7200,
    "user_id":"USER_ID",
    "scope":"SCOPE"
    }
参数	| 说明
---|---
access_token	|接口调用凭证
expires_at|	access_token接口调用凭证超时时间，单位（秒）
user_id|	授权用户唯一标识
scope	|用户授权的作用域，使用逗号（,）分隔


### 第三步：通过access_token调用接口
获取access_token后，进行接口调用，有以下前提：
1. access_token有效且未超时；
2. 监听者用户已授权给第三方主题相应接口作用域（scope）。
对于接口作用域（scope），能调用的接口有以下：

授权作用域（scope）|	接口|	接口说明
---|---|---
user_id_read|	/user_id	|获取用户id


目前监听者主题还为邀请开放阶段，如果你想在监听者上运营自己的主题，请发邮件到xiaomingplus@qq.com 申请。
