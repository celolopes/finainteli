import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { LayoutRectangle } from "react-native";

export interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
}

interface TutorialContextType {
  targets: Record<string, LayoutRectangle>;
  registerTarget: (id: string, layout: LayoutRectangle) => void;
  activeStepIndex: number;
  isActive: boolean;
  startTutorial: (steps: TutorialStep[]) => void;
  nextStep: () => void;
  skipTutorial: () => void;
  currentStep: TutorialStep | null;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [targets, setTargets] = useState<Record<string, LayoutRectangle>>({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);

  const registerTarget = useCallback((id: string, layout: LayoutRectangle) => {
    setTargets((prev) => ({ ...prev, [id]: layout }));
  }, []);

  const startTutorial = (newSteps: TutorialStep[]) => {
    setSteps(newSteps);
    setActiveStepIndex(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (activeStepIndex < steps.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      setIsActive(false); // Fim
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
  };

  const currentStep = isActive && steps[activeStepIndex] ? steps[activeStepIndex] : null;

  return (
    <TutorialContext.Provider
      value={{
        targets,
        registerTarget,
        activeStepIndex,
        isActive,
        startTutorial,
        nextStep,
        skipTutorial,
        currentStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("useTutorial must be used within TutorialProvider");
  return context;
};
