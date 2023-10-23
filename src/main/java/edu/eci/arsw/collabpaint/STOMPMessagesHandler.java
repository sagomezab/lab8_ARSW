package edu.eci.arsw.collabpaint;

import edu.eci.arsw.collabpaint.model.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Controller
public class STOMPMessagesHandler {
    @Autowired
    SimpMessagingTemplate msgt;

    private HashMap<String, ConcurrentLinkedQueue<Point>> points = new HashMap<>();


    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!:" + pt);
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);
        if (!points.containsKey(numdibujo)){
            points.put(numdibujo, new ConcurrentLinkedQueue<>());
        }
        ConcurrentLinkedQueue<Point> p = points.get(numdibujo);
        if (!p.contains(pt)) {
            p.add(pt);
        }
        if (p.size() > 3) {
            msgt.convertAndSend("/topic/newpolygon." + numdibujo, p);

        }
    }
}
