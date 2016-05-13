//百度地图API功能
function loadJScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://api.map.baidu.com/api?v=2.0&ak=VxWnr1fdpGyd8pLYRkwK96HQ&callback=init";
    document.body.appendChild(script);
}

function init() {
    g_map.map = new BMap.Map("map"); // 创建Map实例
    g_map.map.addControl(new BMap.NavigationControl());
    var point = new BMap.Point(114.066162, 22.552369);
    g_map.map.centerAndZoom(point, 13);
    g_map.map.enableScrollWheelZoom(); //启用滚轮放大缩小
    var deviceIds = localStorage.getItem("deviceIds");
    if ((deviceIds != null) && (deviceIds != "")) {
        var deviceIds = localStorage.getItem("deviceIds");
        showCarPosition(deviceIds);
        $("#refresh_car_btn").css("display", "block");
    } else {
        //浏览器定位
        var geolocation = new BMap.Geolocation();
        geolocation.getCurrentPosition(function(r) {
            if (this.getStatus() == BMAP_STATUS_SUCCESS) {
                g_map.map.panTo(r.point);
            }
        }, {
            enableHighAccuracy: true
        });
    }
}
window.onload = loadJScript; //异步加载地图

$(document).ready(function() {
    isLogin();
    //初始化样式
    $("#select_car_res>ul").css("height", g_window.height - 380);
    $("#car_list").css({
        "margin-left": (g_window.width - 280) / 2,
        "height": g_window.height - 100
    });
    $("#car_list>ul").css("height", g_window.height - 160);
    //初始化加载信息
    getTotalInfo();

    //点击'选择车辆'按钮,弹出选择车辆弹层
    $("#select_car_btn").on("click", function() {
        $("#select_car_info>ul>li").not("#companyTeam").remove();
        $("#select_car_layer").css("display", "block");
        var msg = getAjax("/api/vehicle/getMotorcades");
        if (msg.status == 0) {
            $("#select_car_info>h3").html(msg.data.companyName);
            for (var i = 0; i < msg.data.motorcades.length; i++) {
                var li = $("#car_team").clone().removeAttr("id");
                $("#select_car_info>ul").append(li.html(msg.data.motorcades[i].motorcadeName).attr("data-id", msg.data.motorcades[i].motorcadeID).on("click", {
                    type: "motorcade",
                    index: 1
                }, dumpLayer));
            }
            //清除选中结果列表的车辆列表的数据，防止再次打开有数据
            $("#select_car_res>ul").empty();
            showSelectCar(g_car.vehicles);
        } else {
            tips("网络异常");
        }
    });

    //点击公司默认车队获取车辆列表
    $("#companyTeam").on("click", {
        type: "company",
        index: 1
    }, dumpLayer);

    //车辆列表分页
    $("#car_list>ul").on("scroll", function() {
        var top = $("#car_list>ul").scrollTop();
        var height = $("#car_list>ul").height();
        var th = $("#car_list>ul").height() - height;
        if (top > th) {
            var currentPage = g_car.currentPage;
            var totalPage = g_car.totalPage;
            if (currentPage < totalPage) {
                var type = $("#car_team_name").attr("type");
                var e = {
                    data: {
                        type: type,
                        index: currentPage + 1
                    }
                };
                dumpLayer(e);
            }
        }
    });

    //关闭车队车辆列表弹层
    $("#car_list_btn").on("click", function() {
        $("#car_list_layer").css("display", "none");
        showSelectCar(g_car.vehicles);
    });

    //车辆选中后点击确认
    $(".select_confirm>a").on("click", function() {
        var vehicles = g_car.vehicles;
        deviceIds = [];
        for (var i = 0; i < vehicles.length; i++) {
            deviceIds.push(vehicles[i].deviceID);
        }
        //保存deviceID
        localStorage.setItem("deviceIds", deviceIds);
        //刷新按钮显示
        if (vehicles.length != 0) {
            $("#refresh_car_btn").css("display", "block");
        } else {
            $("#refresh_car_btn").css("display", "none");
        }
        //更新头部信息
        getTotalInfo();
        g_map.clearMarker();
        showCarPosition(getVehicles(vehicles));
    });

    //点击刷新，刷新车辆位置信息
    $("#refresh_car_btn").on("click", function() {
        var deviceIds = localStorage.getItem("deviceIds");
        //更新头部信息
        getTotalInfo();
        g_map.clearMarker();
        showCarPosition(deviceIds);
    });
});

//获取头部信息
function getTotalInfo() {
    var msg = getAjax("/api/vehicle/getCarCount");
    if (msg.status == 0) {
        $("#car_total").html(msg.data.carCountInfo.carTotal);
        $("#car_open").html(msg.data.carCountInfo.onlineTotal);
        $("#car_close").html(msg.data.carCountInfo.offlineTotal);
        $("#car_lose").html(msg.data.carCountInfo.fallTotal);
    } else {
        tips("网络异常");
    }
}

//点击车队获取车辆列表
function dumpLayer(e) {
    var n = e.data.index;
    $("#car_list_layer").css("display", "block");
    if (e.data.type == "motorcade") {
        $("#car_team_name").html($(this).html()).attr({
            "type": "motorcade",
            "data-id": $(this).attr("data-id")
        });
        var motorcadeID = $("#car_team_name").attr("data-id");
        var msg = getCarByMotorcadeId(motorcadeID, n);
    } else if (e.data.type == "company") {
        $("#car_team_name").html($("#select_car_info>h3").html()).attr("type", "company");
        var msg = getCarByCompanyId(n);
    }
    if (msg.status == 0) {
        g_car.totalPage = msg.data.pageList.totalPage;
        g_car.currentPage = msg.data.pageList.currentPage;
        showCarList(msg.data.vehicles);
    } else {
        tips("网络异常");
    }
}

//展示车队车辆信息列表
function showCarList(vehicles) {
    if (vehicles.length > 0) {
        for (var i = 0; i < vehicles.length; i++) {
            var li = $("#car_info").clone().removeAttr("id");
            //循环车辆之前是否选择
            if (isCarSelected(vehicles[i].deviceID)) {
                li.children(".car_gray").addClass("car_select").on("click", selectCar);
            } else {
                li.children(".car_gray").on("click", selectCar);
            }
            li.children(".car_text").html(vehicles[i].deviceName).attr({
                "device-id": vehicles[i].deviceID,
                "dstate-id": vehicles[i].isDeviceState,
                "vstate-id": vehicles[i].isVehicleState
            });
            if (vehicles[i].isDeviceState == 0) {
                li.children(".car_acc").html("在线").css("color", "#3198db");
                if (vehicles[i].isVehicleState == 0) {
                    li.children(".car_state").html("行驶中").css("color", "#3198db")
                } else if (vehicles[i].isVehicleState == 1) {
                    li.children(".car_state").html("怠速").css("color", "#3198db")
                } else if (vehicles[i].isVehicleState == 2) {
                    li.children(".car_state").html("停止").css("color", "#565c6a")
                }
            } else if (vehicles[i].isDeviceState == 1) {
                li.children(".car_acc").html("离线").css("color", "#565c6a");
            } else if (vehicles[i].isDeviceState == 2) {
                li.children(".car_acc").html("掉线").css("color", "#b3b3b3");
            }
            $("#car_list>ul").append(li);
        }
    } else {
        $("#car_list>ul").append("<p style=width:100%;text-align:center;padding-top:20px;font-size:16px;color:#888;>无车辆信息</p>")
    }
    //清除选中结果列表的车辆列表的数据，防止再次打开有数据
    $("#select_car_res>ul").empty();
}

//点击选择车辆
function selectCar() {
    //最大选择车辆数为10
    var carObj = {};
    carObj.deviceName = $(this).next().html();
    carObj.deviceID = $(this).next().attr("device-id");
    carObj.isDeviceState = $(this).next().attr("dstate-id");
    carObj.isVehicleState = $(this).next().attr("vstate-id");
    if (g_car.vehicles.length > 9) {
        if ($(this).hasClass("car_select")) {
            g_car.vehicles.deleteObj(carObj);
            $(this).removeClass("car_select");
        }else{
           tips("超过10台,不利于您查看位置哦");
            return; 
        }
    } else {
        if (!$(this).hasClass("car_select")) {
            g_car.vehicles.distinctObj(carObj);
            $(this).addClass("car_select");
        } else {
            g_car.vehicles.deleteObj(carObj);
            $(this).removeClass("car_select");
        }
    }
}

//显示已选择的车辆
function showSelectCar(vehicles) {
    for (var i = 0; i < vehicles.length; i++) {
        var li = $("#car_res").clone().removeAttr("id");
        li.children(".res_text").html(vehicles[i].deviceName).attr("device-id", vehicles[i].deviceID);
        if (vehicles[i].isDeviceState == 0) {
            li.children(".res_acc").html("在线").css("color", "#3198db");
            if (vehicles[i].isVehicleState == 0) {
                li.children(".res_state").html("行驶中").css("color", "#3198db");
            } else if (vehicles[i].isVehicleState == 1) {
                li.children(".res_state").html("怠速").css("color", "#3198db");
            } else if (vehicles[i].isVehicleState == 2) {
                li.children(".res_state").html("停止").css("color", "#565c6a");
            }
        } else if (vehicles[i].isDeviceState == 1) {
            li.children(".res_acc").html("离线").css("color", "#565c6a");
        } else if (vehicles[i].isDeviceState == 2) {
            li.children(".res_acc").html("掉线").css("color", "#b3b3b3");
        }
        li.children(".res_btn").on("click", deleteCar);
        $("#select_car_res>ul").append(li);
    }
    //清除车队车辆列表弹层的数据，防止再次打开有数据
    $("#car_list>ul").empty();
}

//删除选中结果列表的车辆
function deleteCar() {
    var deviceID = $(this).prev().prev().attr("device-id");
    var vehicles = g_car.vehicles;
    for (var i in vehicles) {
        var carOne = vehicles[i].deviceID;
        if (deviceID == carOne) {
            g_car.vehicles.splice(i, 1);
            break;
        }
    }
    $(this).parent().remove();
}

//在地图上显示选中车辆位置
function showCarPosition(deviceIds) {
    //获取车辆设备当前位置信息
    $.ajax({
        type: "POST",
        url: g_params.baseURL + "/api/vehicle/getVehiclesPosition",
        data: {
            "appSys": g_params.appSys,
            "appVer": g_params.appVer,
            "network": g_params.network,
            "token": localStorage.getItem("token_weixin"),
            "deviceIds": deviceIds
        },
        dataType: "json",
        async: false,
        success: function(msg) {
            if (msg.status == 0) {
                var vehicles = msg.data.vehicles;
                for (var i = 0; i < vehicles.length; i++) {
                    var carObj = {};
                    carObj.deviceName = vehicles[i].deviceName;
                    carObj.deviceID = vehicles[i].deviceID;
                    carObj.isDeviceState = vehicles[i].isDeviceState;
                    carObj.isVehicleState = vehicles[i].isVehicleState;
                    g_car.vehicles.distinctObj(carObj);
                }
                for (var i = 0; i < vehicles.length; i++) {
                    if (vehicles[i].longitude != 0) {
                        g_map.map.panTo(new BMap.Point(vehicles[i].longitude, vehicles[i].latitude));
                        break;
                    }
                }
                showBMap(vehicles);
            } else {
                $("#select_car_layer").css("display", "none");
            }
        }
    });
}

//根据车辆信息在地图上显示
function showBMap(data) {
    $("#select_car_layer").css("display", "none");
    var deviceStr = "";
    for (var i = 0; i < data.length; i++) {
        if (data[i].longitude != 0) {
            var point = new BMap.Point(data[i].longitude, data[i].latitude);
            getAddress(data[i], point);
        } else {
            deviceStr += data[i].deviceName + ","
        }
    }
    if (deviceStr != "") {
        tips(deviceStr.substring(0, deviceStr.length - 1) + " 暂无位置信息");
    }
}

//根据坐标逆解析地址
function getAddress(data, point) {
    new BMap.Geocoder().getLocation(point, function(rs) {
        var addComp = rs.addressComponents;
        var addr = addComp.city + addComp.district;
        if (addComp.street != null) {
            addr += addComp.street
        }
        if (addComp.street_number != null) {
            addr += addComp.street_number;
        }
        if (data.isDeviceState == 0) {
            var myIcon = new BMap.Icon(g_map.open_icon, new BMap.Size(25, 38), {
                imageSize: new BMap.Size(25, 38)
            });
        } else if (data.isDeviceState == 1) {
            var myIcon = new BMap.Icon(g_map.close_icon, new BMap.Size(25, 38), {
                imageSize: new BMap.Size(25, 38)
            });
        } else if (data.isDeviceState == 2) {
            var myIcon = new BMap.Icon(g_map.lose_icon, new BMap.Size(25, 38), {
                imageSize: new BMap.Size(25, 38)
            });
        }
        var marker = new BMap.Marker(point, {
            icon: myIcon
        }); // 创建标注
        var label = new BMap.Label(data.deviceName, {
            offset: new BMap.Size(-22, -20)
        });
        label.setStyle({
            borderColor: "#dbdbdb",
            padding: "3px 6px",
            fontWeight: "bold",
            color: "#555"
        });
        marker.setLabel(label);
        var content = data;
        content.address = addr;
        g_map.map.addOverlay(marker); // 将标注添加到地图中
        addClickHandler(content, marker);
    });
}

function addClickHandler(content, marker) {
    marker.addEventListener("click", function(e) {
        var point = new BMap.Point(e.target.getPosition().lng, e.target.getPosition().lat);
        if (content.isMisfire == 0) {
            var isMisfire = "(ACC：开启)";
        } else {
            var isMisfire = "(ACC：关闭)";
        }
        if (content.isVehicleState == 0) {
            var isState = "行驶中";
        } else if (content.isVehicleState == 1) {
            var isState = "怠速";
        } else if (content.isVehicleState == 2) {
            var isState = "停止";
        } else {
            var isState = "";
        }
        if (content.motorcadeName == "" || content.motorcadeName == null) {
            content.motorcadeName = "暂未加入车队";
        }
        var sContent = "<h4 style=line-height:20px;font-size:13px;color:#3198db;>" + content.deviceName + "<span style=display:inline-block;width:15px;></span>编号" + content.vehicleNO + "</h4>" +
            "<p style=line-height:20px;font-size:13px;color:#4a4b4d;>" + content.motorcadeName + "</p>" +
            "<p style=line-height:20px;font-size:13px;color:#4a4b4d;>车速:" + content.speed + "km/h<span style=display:inline-block;width:5px;></span>" + isMisfire + "<span style=display:inline-block;width:5px;></span>" + isState + "</p>" +
            "<p style=height:20px;line-height:20px;font-size:13px;color:#4a4b4d;overflow-y:hidden;>位置:" + content.address + "</p>" +
            "<p style=line-height:20px;font-size:13px;color:#4a4b4d;margin-bottom:5px;>上报时间:" + content.reportingTime + "</p>" +
            "<a style=display:inline-block;width:100%;height:35px;line-height:35px;background:#565c5a;font-size:15px;color:#fff;text-align:center; href=path.html?id=" + content.deviceID + "&lng=" + content.longitude + "&lat=" + content.latitude + "&state=" + content.isDeviceState + ">轨迹</a>";
        var opts = {
            width: 180, // 信息窗口宽度
            height: 140, // 信息窗口高度
        };
        var infoWindow = new BMap.InfoWindow(sContent, opts); // 创建信息窗口对象 
        this.openInfoWindow(infoWindow); //开启信息窗口
    });
}
