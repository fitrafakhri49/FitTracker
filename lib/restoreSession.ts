import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function restoreSessionFromStorage() {
  const accessToken = await AsyncStorage.getItem("sb-token");

  if (!accessToken) {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: "",
  });

  if (error) {
    return null;
  }

  return data.session;
}
