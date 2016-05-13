//配置全局基本相关参数
g_params = {
    baseURL: "http://app.chd.aaaaachina.com",
    appSys: "Android",
    appVer: "1.0.1",
    network: "4G",
};

//文档窗口信息
g_window = {
    width: $(window).width(),
    height: $(window).height(),
};

//配置全局车辆相关参数
g_car = {
    vehicles: [],
    pageSize: 20, //分页大小
    totalPage: 0, //总页数
    currentPage: 1, //当前页数
};

//车轨迹相关参数
g_pos = {
    deviceID: "", //设备ID
    startTime: "", //开始时间
    endTime: "", //结束时间
    pageSize: 20, //每次请求数据大小
    totalPage: 0, //总页数
    pageIndex: 1, //当前页
    arrData: null, //坐标数据
    carMk: null, //车图标
    polyline: null, //数据线路
    endPoint: null, //最后一个点
    timeout: null, //定时器
};

//配置全局地图相关参数
g_map = {
    map: null,
    open_icon: "./image/open_icon.png",
    close_icon: "./image/close_icon.png",
    lose_icon: "./image/lose_icon.png",
    start_icon: "./image/start_icon.png",
    end_icon: "./image/end_icon.png",
    clearMarker: function() {
        this.map.clearOverlays();
    }
};

//判断是否已经登录
function isLogin() {
    if (!localStorage.getItem("token_weixin")) {
        location.href = g_params.baseURL + "/login.html";
    }
}

//异步请求数据函数
function getAjax(subURL) {
    $.ajax({
        type: "POST",
        url: g_params.baseURL + subURL,
        data: {
            "appSys": g_params.appSys,
            "appVer": g_params.appVer,
            "network": g_params.network,
            "token": localStorage.getItem("token_weixin"),
            "companyID": localStorage.getItem("companyID")
        },
        dataType: "json",
        async: false,
        success: function(msg) {
            data = msg;
        }
    });
    return data;
}

function getCarByCompanyId(pageIndex) {
    $.ajax({
        type: "POST",
        url: g_params.baseURL + "/api/vehicle/getVehiclesByCompanyId",
        data: {
            "appSys": g_params.appSys,
            "appVer": g_params.appVer,
            "network": g_params.network,
            "token": localStorage.getItem("token_weixin"),
            "companyID": localStorage.getItem("companyID"),
            "pageSize": g_car.pageSize,
            "pageIndex": pageIndex
        },
        dataType: "json",
        async: false,
        success: function(msg) {
            data = msg;
        }
    });
    return data;
}

function getCarByMotorcadeId(motorcadeID, pageIndex) {
    $.ajax({
        type: "POST",
        url: g_params.baseURL + "/api/vehicle/getVehiclesByMotorcadeId",
        data: {
            "appSys": g_params.appSys,
            "appVer": g_params.appVer,
            "network": g_params.network,
            "token": localStorage.getItem("token_weixin"),
            "motorcadeID": motorcadeID,
            "pageSize": g_car.pageSize,
            "pageIndex": pageIndex
        },
        dataType: "json",
        async: false,
        success: function(msg) {
            data = msg;
        }
    });
    return data;
}

//添加不同的数组元素，相同的就不添加(字符串)
Array.prototype.distinctStr = function(str) {
    for (var i in this) {
        if (str == this[i]) {
            return;
        }
    }
    this.push(str);
}

//添加不同的数组元素，相同的就不添加(对象)
Array.prototype.distinctObj = function(obj) {
    for (var i in this) {
        if (isObjectValueEqual(obj, this[i])) {
            return;
        }
    }
    this.push(obj);
}

//根据元素内容删除数组元素(字符串)
Array.prototype.deleteStr = function(str) {
    for (var i in this) {
        if (str == this[i]) {
            this.splice(i, 1);
            return;
        }
    }
}

//根据元素内容删除数组元素(对象)
Array.prototype.deleteObj = function(obj) {
    for (var i in this) {
        if (isObjectValueEqual(obj, this[i])) {
            this.splice(i, 1);
            return;
        }
    }
}

//根据元素内容查询数组元素是否存在(字符串)
Array.prototype.selectStr = function(str) {
    for (var i in this) {
        if (str == this[i]) {
            return true;
        }
    }
    return false;
}

//根据元素内容查询数组元素是否存在(对象)
Array.prototype.selectObj = function(obj) {
    for (var i in this) {
        if (isObjectValueEqual(obj, this[i])) {
            return true;
        }
    }
    return false;
}

//判断两个对象是否相等
function isObjectValueEqual(a, b) {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) {
        return false;
    }
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
}

//获取车辆deviceID
function getVehicles(vehicles) {
    var str = "";
    for (var i = 0; i < vehicles.length; i++) {
        str += vehicles[i].deviceID + ",";
    }
    return str.substring(0, str.length - 1);
}

//判断车辆列表里的车辆是否选中
function isCarSelected(carOne) {
    var vehicles = g_car.vehicles;
    for (var j in vehicles) {
        if (vehicles[j].deviceID == carOne) {
            return true;
        }
    }
    return false;
}

//获取url中的参数
function getParam(str) {
    var search = location.search;
    var str = str + "=";
    var subStr = search.substring(search.indexOf(str) + str.length, search.length)
    if (subStr.indexOf("&") != -1) {
        return subStr.substring(0, subStr.indexOf("&"));
    } else {
        return subStr.substring(0, subStr.length);
    }
}

//错误提示
function tips(str) {
    $("body").append("<div class=center_tips>" + str + "</div>");
    setTimeout(function() {
        $(".center_tips").remove();
    }, 3000);
}
