function isLogin() {
    //判断是否存在token值
    if (localStorage.getItem("token_weixin")) {
        window.location.href = "index.html";
    }
}
window.onload = isLogin; //判断是否已经登录过

$(document).ready(function() {
    //登录提交
    $("input[type=submit]").on("click", function() {
        //账号
        var loginName = $("input[name=loginName]").val();
        //密码
        var password = $("input[name=password]").val();
        //判断账号为空
        if (loginName == "" || loginName == null) {
            tips("请输入账号");
            return;
        }
        //判断密码为空
        if (password == "" || password == null) {
            tips("请输入密码");
            return;
        }
        //登录请求
        $.ajax({
            type: "POST",
            url: g_params.baseURL + "/api/account/inLogin",
            data: {
                "appSys": g_params.appSys,
                "appVer": g_params.appVer,
                "network": g_params.network,
                "loginName": loginName,
                "password": password
            },
            dataType: "json",
            success: function(msg) {
                //登录成功之后跳转
                if (msg.status == 0) {
                    localStorage.setItem("token_weixin", decodeURIComponent(msg.data.loginInfo.token));
                    localStorage.setItem("companyID", msg.data.loginInfo.companyID);
                    window.location.href = "index.html";
                } else {
                    tips("账号或密码有误，请重新输入");
                }
            }
        });
    });
});
