var app = (function () {

    var topic = "0";

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function (topic) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic' + topic, function(eventbody){
                //alert(eventbody);
                var pt = JSON.parse(eventbody.body);
                addPointToCanvas(pt);
            });
        });

    };
    
    

    return {

        init: function () {
            var can = document.getElementById("canvas");
            if(window.PointerEvent){
                can.addEventListener("pointerdown", function(event){
                    var point = getMousePosition(event);
                    addPointToCanvas(point);
                    stompClient.send("/topic/newpoint", {}, JSON.stringify(point));
                });
            }
            //websocket connection
            connectAndSubscribe();
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);
            stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
            //publicar el evento
        },

        connect: function(){
            var can = document.getElementById("canvas");
            var opt = document.getElementById("connection");
            var drawId = $("#drawId").val();
            topic = opt.value + drawId;
            alert("you are connected to:" + drawId);
            connectAndSubscribe(topic);
            if(window.PointerEvent){
                can.addEventListener("pointerdown", function(event){
                    var point = getMousePosition(event);
                    addPointToCanvas(point);
                    stompClient.send("/topic"+topic, {}, JSON.stringify(point));
                });
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();