import {  expo} from "../lib/expo";
import { supabase } from "../supabase/client";
import { Request,Response } from "express";
import { Expo } from "expo-server-sdk";

export async function pushTokenNotification(req:Request,res:Response) {
    try {
        const { userId, title, body, data } = req.body;
    
        if (!userId || !title || !body) {
          return res.status(400).json({
            message: "userId, title, and body are required",
          });
        }
    
        const { data: tokens, error } = await supabase
          .from("expo_push_tokens")
          .select("token")
          .eq("user_id", userId);
    
        if (error) {
          return res.status(500).json({ message: error.message });
        }
    
        if (!tokens || tokens.length === 0) {
          return res.status(404).json({ message: "No tokens found" });
        }
    
        const messages = tokens
          .filter((t) => Expo.isExpoPushToken(t.token))
          .map((t) => ({
            to: t.token,
            sound: "default",
            title,
            body,
            data,
          }));
    
        const chunks = expo.chunkPushNotifications(messages);
    
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
    
        return res.json({ success: true });
      } catch (error) {
        console.error("Send notification error:", error);
        return res.status(500).json({
          message: "Internal server error",
        });
      }
}