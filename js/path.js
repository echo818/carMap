//百度地图API功能
function loadJScript() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://api.map.baidu.com/api?v=2.0&ak=VxWnr1fdpGyd8pLYRkwK96HQ&callback=init";
    document.body.appendChild(script);
}

function init() {
    g_map.map = new BMap.Map("path_map"); // 创建Map实例
    g_map.map.addControl(new BMap.NavigationControl());
    var point = new BMap.Point(getParam("lng"), getParam("lat"));
    g_map.map.centerAndZoom(point, 15);
    g_map.map.enableScrollWheelZoom(); //启用滚轮放大缩小
}
window.onload = loadJScript; //异步加载地图

$(document).ready(function() {
    isLogin();
    $(".path_header>input[name=date]").css("margin-left", (g_window.width - 308) / 2);
    //选择日期
    $("input[name=date]").mobiscroll().date({
        theme: "mobiscroll",
        lang: "zh",
        display: "modal",
        mode: "scroller",
        maxDate: new Date()
    });
    //选择开始时间
    $("input[name=startTime]").mobiscroll().time({
        theme: "mobiscroll",
        lang: "zh",
        display: "modal",
        mode: "scroller"
    });
    //选择结束时间
    $("input[name=endTime]").mobiscroll().time({
        theme: "mobiscroll",
        lang: "zh",
        display: "modal",
        mode: "scroller"
    });

    //点击回放按钮
    $("#history_play>img").on("click", clickPlay);
});

function clickPlay() {
    clearTimeout(g_pos.timeout);
    g_map.clearMarker();
    g_pos.pageIndex = 1;
    var date = $("input[name=date]").val();
    var sTime = $("input[name=startTime]").val();
    var eTime = $("input[name=endTime]").val();
    if (date != "" & sTime != "" & eTime != "") {
        if (sTime < eTime) {
            g_pos.deviceID = getParam("id");
            g_pos.startTime = date + " " + sTime + ":00"; //"2016-03-01 09:19:25";
            g_pos.endTime = date + " " + eTime + ":00"; //"2016-03-01 19:42:07";
        } else {
            tips("起始时间要小于结束时间");
            return;
        }
    } else {
        tips("请先选择日期/时间");
        return;
    }
    var msg = getHistoryPosition(g_pos.pageIndex); //第一次获取数据
    g_pos.arrData = msg.data.points;
    if (g_pos.arrData.length != 0) {
        var isState = getParam("state");
        if (isState == 0) {
            var car_icon = g_map.open_icon;
        } else if (isState == 1) {
            var car_icon = g_map.close_icon;
        } else if (isState == 2) {
            var car_icon = g_map.lose_icon;
        }
        //移动图标
        var myIcon = new BMap.Icon(car_icon, new BMap.Size(25, 38), {
            imageSize: new BMap.Size(25, 38),
            imageOffset: new BMap.Size(0, 0)
        });
        //起点坐标
        var sPoint = new BMap.Point(g_pos.arrData[0].longitude, g_pos.arrData[0].latitude);
        g_pos.carMk = new BMap.Marker(sPoint, {
            icon: myIcon
        });
        g_map.map.addOverlay(g_pos.carMk);
        g_pos.endPoint = sPoint;
        var mark = new BMap.Marker(sPoint, {
            icon: new BMap.Icon(g_map.start_icon, new BMap.Size(15, 21), {
                imageSize: new BMap.Size(15, 21),
                imageOffset: new BMap.Size(0, 0)
            })
        });
        g_map.map.addOverlay(mark);
        //终点坐标位置
        var ePoint = new BMap.Point(msg.data.lastPoint.longitude, msg.data.lastPoint.latitude);
        var mark = new BMap.Marker(ePoint, {
            icon: new BMap.Icon(g_map.end_icon, new BMap.Size(15, 21), {
                imageSize: new BMap.Size(15, 21),
                imageOffset: new BMap.Size(0, 0)
            })
        });
        g_map.map.addOverlay(mark);
        g_pos.totalPage = msg.data.pageList.totalPage; //总页数
        playHistoryPosition(g_pos.arrData);
    } else {
        tips("该时间段，暂未发现位置");
    }
}

//获取车辆历史轨迹坐标
function getHistoryPosition(pageIndex) {
    var data = null;
    $.ajax({
        type: "POST",
        url: g_params.baseURL + "/api/vehicle/getVehicleHistoryPositions",
        data: {
            "appSys": g_params.appSys,
            "appVer": g_params.appVer,
            "network": g_params.network,
            "token": localStorage.getItem("token_weixin"),
            "deviceID": g_pos.deviceID,
            "startTime": g_pos.startTime,
            "endTime": g_pos.endTime,
            "pageSize": g_pos.pageSize,
            "pageIndex": pageIndex
        },
        dataType: "json",
        async: false,
        success: function(msg) {
            if (msg.status == 0) {
                g_pos.pageIndex = msg.data.pageList.currentPage + 1; //下一页
                data = msg;
            } else {
                tips("网络异常");
            }
        }
    });
    return data;
}

//回放历史轨迹
function playHistoryPosition(arrData) {
    var data = arrData;
    var points = [];
    points.push(g_pos.endPoint);
    for (var i = 0; i < data.length; i++) {
        points.push(new BMap.Point(data[i].longitude, data[i].latitude));
    }
    //重新标注并移动位置
    function resetMkPoint(j) {
        g_pos.carMk.setPosition(points[j]);
        if (j < points.length) {
            g_map.map.panTo(points[j]);
            g_car.polyline = new BMap.Polyline([points[j - 1], points[j]], {
                strokeColor: "#a440e3",
                strokeWeight: 3,
                strokeOpacity: 1
            });
            g_map.map.addOverlay(g_car.polyline);
            g_pos.timeout = setTimeout(function() {
                j++;
                resetMkPoint(j);
            }, 750);
            if (j == g_pos.pageSize / 2) {
                var msg = getHistoryPosition(g_pos.pageIndex);
                g_pos.arrData = msg.data.points;
            }
            if (j == g_pos.pageSize) {
                g_pos.endPoint = points[j];
            }
        } else {
            if (g_pos.pageIndex - 1 <= g_pos.totalPage) {
                playHistoryPosition(g_pos.arrData);
            }
        }
    }
    setTimeout(function() {
        resetMkPoint(1);
    }, 750);
}
