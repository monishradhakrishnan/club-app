import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ClubProfileScreen from "../screens/ClubProfileScreen";
import ClubManageScreen from "../screens/ClubManageScreen";
import CreateEventScreen from "../screens/CreateEventScreen";
import ClubsScreen from "../screens/ClubsScreen";
import BudgetScreen from "../screens/BudgetScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import AdminScreen from "../screens/AdminScreen";

const AuthStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

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

// Home is its own stack so tapping a club box can push a detail screen
// (club profile for students, club management + create event for staff)
// while the bottom tab bar stays visible.
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerRight: () => <LogoutButton /> }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home" }} />
      <HomeStack.Screen
        name="ClubProfile"
        component={ClubProfileScreen}
        options={({ route }) => ({ title: route.params?.clubName || "Club" })}
      />
      <HomeStack.Screen
        name="ClubManage"
        component={ClubManageScreen}
        options={({ route }) => ({ title: route.params?.clubName || "Club" })}
      />
      <HomeStack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: "Create event" }}
      />
    </HomeStack.Navigator>
  );
}

const TAB_ICONS = {
  Home: "home-outline",
  Clubs: "people-outline",
  Budget: "cash-outline",
  Attendance: "qr-code-outline",
  Admin: "shield-checkmark-outline",
};

function MainNavigator() {
  const { user } = useAuth();

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
      {/* Home's own stack renders its own headers, so the outer tab header is hidden here */}
      <Tabs.Screen name="Home" component={HomeStackScreen} options={{ headerShown: false }} />
      <Tabs.Screen name="Clubs" component={ClubsScreen} />
      <Tabs.Screen name="Budget" component={BudgetScreen} />
      <Tabs.Screen name="Attendance" component={AttendanceScreen} />
      {user?.role === "ADMIN" && (
        <Tabs.Screen name="Admin" component={AdminScreen} />
      )}
    </Tabs.Navigator>
  );
}

const linking = {
  prefixes: [],
  config: {
    screens: {
      Login: "login",
      Register: "register",
      Home: {
        screens: {
          HomeMain: "",
          ClubProfile: "clubs/:clubId/profile",
          ClubManage: "clubs/:clubId/manage",
          CreateEvent: "clubs/:clubId/events/new",
        },
      },
      Clubs: "clubs",
      Budget: "budget",
      Attendance: "attendance",
      Admin: "admin",
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
