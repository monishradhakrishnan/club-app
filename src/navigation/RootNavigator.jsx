import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ClubsScreen from "../screens/ClubsScreen";
import BudgetScreen from "../screens/BudgetScreen";
import AttendanceScreen from "../screens/AttendanceScreen";

const AuthStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
      <Text style={{ color: "#ff0404bd", fontWeight: "600" }}>Log out</Text>
    </TouchableOpacity>
  );
}

// Maps each tab's route name to an Ionicons icon name.
const TAB_ICONS = {
  Home: "home-outline",
  Clubs: "people-outline",
  Budget: "cash-outline",
  Attendance: "qr-code-outline",
};

function MainNavigator() {
  return (
    <Tabs.Navigator
      backBehavior="initialRoute"
      screenOptions={({ route }) => ({
        headerRight: () => <LogoutButton />,
        tabBarActiveTintColor: "#3E5C50",
        tabBarInactiveTintColor: "#1C232166",
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Clubs" component={ClubsScreen} />
      <Tabs.Screen name="Budget" component={BudgetScreen} />
      <Tabs.Screen name="Attendance" component={AttendanceScreen} />
    </Tabs.Navigator>
  );
}

const linking = {
  prefixes: [],
  config: {
    screens: {
      Login: "login",
      Register: "register",
      Home: "",
      Clubs: "clubs",
      Budget: "budget",
      Attendance: "attendance",
    },
  },
};

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F5F1" }}>
        <ActivityIndicator size="large" color="#1C2321" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}