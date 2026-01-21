import React, { ReactNode, useEffect, useRef } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { useTutorial } from "../../context/TutorialContext";

interface Props {
  id: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const CoachMarkTarget = ({ id, children, style }: Props) => {
  const { registerTarget, isActive } = useTutorial();
  const viewRef = useRef<View>(null);

  useEffect(() => {
    // Medir periodicamente ou quando active mudar para garantir posição correta (scroll pode afetar)
    // Em produção ideal, usaríamos onLayout no ScrollView para recalcular, mas timeout serve para demo.
    if (!isActive) return;

    const measure = () => {
      viewRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          registerTarget(id, { x, y, width, height });
        }
      });
    };

    // Pequeno delay para garantir renderização e animação de entrada
    const timer = setTimeout(measure, 500);
    return () => clearTimeout(timer);
  }, [isActive, id, registerTarget]);

  return (
    <View ref={viewRef} style={style} collapsable={false}>
      {children}
    </View>
  );
};
