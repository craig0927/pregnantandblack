import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Card, H2, Screen, Text } from "../../components/Ui";
import { fonts } from "../../theme/theme";
import type { ScheduleStackParamList } from "../../navigation/ScheduleStack";

type Nav = NativeStackNavigationProp<ScheduleStackParamList, "AppointmentDetail">;

type Appointment = {
  id: string;
  hca_id?: string;
  date: string;
  time: string;
  hca: string;
  location?: string;
  joinUrl?: string;
};

type Props = {
  route?: {
    params?: {
      appointment?: Appointment;
    };
  };
};

export default function AppointmentDetail({ route }: Props) {
  const navigation = useNavigation<Nav>();

  const apt = route?.params?.appointment ?? {
    id: "unknown",
    date: "Jan 1, 2026",
    time: "12:00 AM",
    hca: "Unknown",
    joinUrl: "",
  };

  const handleReschedule = () => {
    if (!apt.id || apt.id === "unknown" || !apt.hca_id) {
      Alert.alert("Unable to reschedule", "Missing appointment information.");
      return;
    }
    navigation.navigate("RescheduleAppointment", {
      appointmentId: apt.id,
      hcaId: apt.hca_id,
      hcaName: apt.hca,
      currentDate: apt.date,
      currentTime: apt.time,
    });
  };

  return (
    <Screen>
      <H2>Appointment Details</H2>

      <Card style={styles.card}>
        <Text bold style={styles.label}>Date:</Text>
        <Text style={styles.value}>{apt.date}</Text>

        <Text bold style={[styles.label, { marginTop: 12 }]}>
          Time:
        </Text>
        <Text style={styles.value}>{apt.time}</Text>

        <Text bold style={[styles.label, { marginTop: 12 }]}>
          Health Care Advocate:
        </Text>
        <Text style={styles.value}>{apt.hca}</Text>

        {apt.location && (
          <>
            <Text bold style={[styles.label, { marginTop: 12 }]}>
              Location:
            </Text>
            <Text style={styles.value}>{apt.location}</Text>
          </>
        )}

        <View style={styles.buttonContainer}>
          <Button
            label="Reschedule"
            variant="outline"
            onPress={handleReschedule}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  label: { fontFamily: fonts.bold },
  value: { fontFamily: fonts.regular },
  buttonContainer: { marginTop: 24, gap: 12 },
});
