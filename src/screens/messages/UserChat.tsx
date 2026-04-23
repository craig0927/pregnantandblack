import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";
import type { MessagesStackParamList } from "../../navigation/MessagesStack";
import ChatThread from "./ChatThread";

type Props = NativeStackScreenProps<MessagesStackParamList, "UserChat">;

export default function UserChat({ route, navigation }: Props) {
  const { conversationId, name } = route.params;
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [hcaTimeZone, setHcaTimeZone] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const { data } = await supabase
          .from("appointments")
          .select("date, start_time, hca_profile:profiles!appointments_hca_id_fkey(hca)")
          .eq("conversation_id", conversationId)
          .maybeSingle();

        if (!alive) return;

        if (data?.date && data?.start_time) {
          setSessionDate(data.date);
          setSessionStartTime(String(data.start_time).slice(0, 5));
          const profile = Array.isArray(data.hca_profile)
            ? data.hca_profile[0]
            : data.hca_profile;
          const tz = profile?.hca?.timeZone ?? null;
          setHcaTimeZone(tz);
        }
      } catch (e) {
        console.error("[UserChat] load error", e);
      }
    };

    load();
    return () => { alive = false; };
  }, [conversationId]);

  return (
    <ChatThread
      conversationId={conversationId}
      viewerRole="birthparent"
      title={name}
      onBack={() => navigation.goBack()}
      sessionDate={sessionDate ?? undefined}
      sessionStartTime={sessionStartTime ?? undefined}
      hcaTimeZone={hcaTimeZone ?? undefined}
    />
  );
}
