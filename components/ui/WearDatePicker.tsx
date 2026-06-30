import { View, Text, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/theme";

const TODAY = new Date().toISOString().split("T")[0];

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export function formatWearDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const label = d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  if (dateStr === TODAY) return `${label} · TODAY`;
  return label;
}

interface Props {
  date: string;
  onChange: (date: string) => void;
}

export function WearDatePicker({ date, onChange }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: date === TODAY ? Colors.border : Colors.ink,
        paddingHorizontal: 4,
        paddingVertical: 6,
        marginBottom: 10,
      }}
    >
      <TouchableOpacity
        onPress={() => onChange(addDays(date, -1))}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ paddingHorizontal: 12, paddingVertical: 4 }}
      >
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.ink }}>
          ←
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange(TODAY)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 11,
            color: date === TODAY ? Colors.muted : Colors.ink,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {formatWearDate(date)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onChange(addDays(date, 1))}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ paddingHorizontal: 12, paddingVertical: 4 }}
      >
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.ink }}>
          →
        </Text>
      </TouchableOpacity>
    </View>
  );
}
