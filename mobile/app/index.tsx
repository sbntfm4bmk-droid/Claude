import { Redirect } from "expo-router";

// Entry point: the AuthGate in _layout handles real routing, so we just
// send users into the tabs (or they'll be bounced to login if logged out).
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
