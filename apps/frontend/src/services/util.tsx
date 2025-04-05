import type { Provider } from "@repo/database";
import {
  AlcampoIcon,
  BPIcon,
  CarrefourIcon,
  CepsaIcon,
  GalpIcon,
  MoeveIcon,
  OterStationIcon,
  PetroprixIcon,
  PlenergyIcon,
  RepsolIcon,
  ShellIcon,
} from "../components/StationIcons";

export const getStationProviderIcon = (
  provider: Provider
): React.ReactElement => {
  if (provider === "plenergy") return <PlenergyIcon />;
  if (provider === "petroprix") return <PetroprixIcon />;
  if (provider === "carrefour") return <CarrefourIcon />;
  if (provider === "repsol") return <RepsolIcon />;
  if (provider === "bp") return <BPIcon />;
  if (provider === "shell") return <ShellIcon />;
  if (provider === "cepsa") return <CepsaIcon />;
  if (provider === "moeve") return <MoeveIcon />;
  if (provider === "galp") return <GalpIcon />;
  if (provider === "alcampo") return <AlcampoIcon />;

  return <OterStationIcon />;
};
