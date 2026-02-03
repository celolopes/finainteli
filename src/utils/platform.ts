import { Platform } from "react-native";

export const getIOSMajorVersion = () => {
  if (Platform.OS !== "ios") {
    return 0;
  }

  const version = Platform.Version;
  if (typeof version === "string") {
    const major = parseInt(version.split(".")[0], 10);
    return Number.isNaN(major) ? 0 : major;
  }

  if (typeof version === "number") {
    return Math.floor(version);
  }

  return 0;
};

export const isIOS26OrNewer = () => getIOSMajorVersion() >= 26;
