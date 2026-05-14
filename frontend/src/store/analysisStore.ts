import { create } from 'zustand';

interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentStage: string;
  startAnalysis: () => void;
  updateProgress: (progress: number, stage: string) => void;
  finishAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  isAnalyzing: false,
  progress: 0,
  currentStage: 'Idle',
  
  startAnalysis: () => set({ 
    isAnalyzing: true, 
    progress: 0, 
    currentStage: 'Fetching repositories from GitHub...' 
  }),
  
  updateProgress: (progress, stage) => set({ 
    progress, 
    currentStage: stage 
  }),
  
  finishAnalysis: () => set({ 
    isAnalyzing: false, 
    progress: 100, 
    currentStage: 'Analysis complete!' 
  }),
}));
