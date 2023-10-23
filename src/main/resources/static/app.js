var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }

    var stompClient = null;
    var topic = "0";
    var pointsPolygon = [];
    var drawings = {};
    var drawId = null;

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
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic' + topic, function(eventbody){
                if(topic.includes("/newpoint.")){
                    var pt = JSON.parse(eventbody.body);
                    addPointToCanvas(pt);
                } else {
                    var pt = JSON.parse(eventbody.body);
                    console.log("Entro al poligono " + pt);
                    pointsPolygon = pt;
                    drawNewPolygon(pointsPolygon);
                }
            });
        });

    };
    
    var drawNewPolygon = function(points){
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.fillStyle='#f00';
        ctx.beginPath();
        for (let i = 1; i < points.length; i++) {
             ctx.moveTo(points[i - 1].x, points[i - 1].y);
             ctx.lineTo(points[i].x, points[i].y);
              if (i === points.length - 1) {
                  ctx.moveTo(points[i].x, points[i].y);
                  ctx.lineTo(points[0].x, points[0].y);
              }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    return {

        init: function () {
            var can = document.getElementById("canvas");
            if(window.PointerEvent){
                can.addEventListener("pointerdown", function(event){
                    var point = getMousePosition(event);
                    //addPointToCanvas(point);
                    stompClient.send("/topic/newpoint.", {}, JSON.stringify(point));
                });
            }
            //websocket connection
            connectAndSubscribe();
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);
            stompClient.send("/app/newpoint." + drawId, {}, JSON.stringify(pt));
            if (!drawings[drawId]) {
                drawings[drawId] = [];
            }
            // Mantener los puntos dibujados por cada ID en el objeto 'drawings'
            drawings[drawId].push(pt);
            if (drawings[drawId].length >= 4) {
                // Enviar el polígono cuando haya al menos 4 puntos
                stompClient.send("/app/newpolygon." + drawId, {}, JSON.stringify(drawings[drawId]));
                drawings[drawId] = [];  // Limpiar los puntos después de enviar el polígono
            }
        },

        connect: function () {
            var canvas = document.getElementById("canvas");
            var ctx = canvas.getContext("2d");
            var option = document.getElementById("connection");
            drawId = $("#drawId").val();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            topic = option.value + drawId;
            console.log(topic);
            alert("You are connect to "+ drawId);
            connectAndSubscribe(topic);
            if(window.PointerEvent){
                canvas.addEventListener("pointerdown", function (event){
                    var point = getMousePosition(event);
                    //addPointToCanvas(point);
                    //stompClient.send("/app"+topic, {}, JSON.stringify(point));
                    app.publishPoint(point.x, point.y);
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