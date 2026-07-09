import { auth } from "@/auth";
import { getCachedUserSettings } from "@/queries/userSettings";
import OnboardingModal from "./OnboardingModal";

export default async function OnBoarding() {
  const session = await auth();

  // If no user is logged in, do not render the onboarding modal
  if (!session?.user?.email) {
    return null;
  }

  const settingsObj = await getCachedUserSettings();

  // If they have not onboarded sources, defaultOpen is true
  const defaultOpen = !settingsObj.hasOnboardedSources;

  // We only really need to render this component into the client if they haven't onboarded yet.
  if (!defaultOpen) {
    return null;
  }

  return (
    <OnboardingModal defaultOpen={defaultOpen} currentSettings={settingsObj} />
  );
}
