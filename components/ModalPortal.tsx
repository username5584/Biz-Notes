import React, { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import {
  runOnJS,
  useSharedValue,
  withTiming,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';

import { DatePickerContent, TimePickerContent } from './modal';
import { MODAL_OPEN_DURATION, MODAL_CLOSE_DURATION, EASE_OUT_CUBIC, EASE_IN_CUBIC } from '@/constants';

interface ModalOptions {
  type: 'date' | 'time';
  value: Date;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
}

interface ModalActionsContextType {
  openModal: (options: Omit<ModalOptions, 'type'> & { type: 'date' | 'time' }) => void;
  closeModal: () => void;
}

interface ModalStateContextType {
  activeModal: ModalOptions | null;
  mounted: boolean;
  animProgress: SharedValue<number>;
  modalKey: number;
  closeModal: () => void;
}

const ModalActionsContext = createContext<ModalActionsContextType | null>(null);
const ModalStateContext = createContext<ModalStateContextType | null>(null);

export function useModalPortal() {
  const actions = useContext(ModalActionsContext);
  if (!actions) {
    throw new Error('useModalPortal must be used within ModalPortalProvider');
  }
  return actions;
}

function useModalState(): ModalStateContextType {
  const state = useContext(ModalStateContext);
  if (!state) {
    throw new Error('ModalRenderer must be used within ModalPortalProvider');
  }
  return state;
}


export function ModalPortalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalOptions | null>(null);
  const [mounted, setMounted] = useState(false);
  const animProgress = useSharedValue(0);
  const modalKeyRef = useRef(0);
  const isOpenRef = useRef(false);

  const onAnimationEnd = useCallback((isFinished: boolean) => {
    if (isFinished) {
      setActiveModal(null);
      setMounted(false);
    }
  }, []);

  const openModal = useCallback((options: Omit<ModalOptions, 'type'> & { type: 'date' | 'time' }) => {
    modalKeyRef.current += 1;
    setMounted(true);
    setActiveModal(options);
    animProgress.value = 0;
    isOpenRef.current = true;

    
    requestAnimationFrame(() => {
      if (isOpenRef.current) {
        animProgress.value = withTiming(1, { duration: MODAL_OPEN_DURATION, easing: EASE_OUT_CUBIC });
      }
    });
  }, [animProgress]);

  const closeModal = useCallback(() => {
    isOpenRef.current = false;
    animProgress.value = withTiming(0, { duration: MODAL_CLOSE_DURATION, easing: EASE_IN_CUBIC }, (isFinished) => {
      if (isFinished) {
        runOnJS(onAnimationEnd)(true);
      }
    });
  }, [animProgress, onAnimationEnd]);

  
  React.useEffect(() => {
    return () => {
      isOpenRef.current = false;
      cancelAnimation(animProgress);
    };
  }, []);

  const actionsValue = useMemo(() => ({
    openModal,
    closeModal,
  }), [openModal, closeModal]);

  const stateValue = useMemo(() => ({
    activeModal,
    mounted,
    animProgress,
    modalKey: modalKeyRef.current,
    closeModal,
  }), [activeModal, mounted, animProgress, closeModal]);

  return (
    <ModalActionsContext.Provider value={actionsValue}>
      {children}
      <ModalStateContext.Provider value={stateValue}>
        <ModalRendererInner />
      </ModalStateContext.Provider>
    </ModalActionsContext.Provider>
  );
}


function ModalRendererInner() {
  const state = useModalState();

  if (!state.mounted || !state.activeModal) return null;

  const ModalComp = state.activeModal.type === 'date' ? DatePickerContent : TimePickerContent;

  return (
    <ModalComp
      key={state.modalKey}
      value={state.activeModal.value}
      onConfirm={state.activeModal.onConfirm}
      onDismiss={state.closeModal}
      animProgress={state.animProgress}
    />
  );
}