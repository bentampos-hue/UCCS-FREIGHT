import { DraftState } from '../types';

export const draftService = {
  saveDraft: (formId: string, data: any) => {
    const draft: DraftState = {
      formId,
      data,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(`uccs_draft_${formId}`, JSON.stringify(draft));
  },

  getDraft: (formId: string): any | null => {
    const raw = localStorage.getItem(`uccs_draft_${formId}`);
    if (!raw) return null;
    try {
      const parsed: DraftState = JSON.parse(raw);
      return parsed.data;
    } catch (e) {
      return null;
    }
  },

  clearDraft: (formId: string) => {
    localStorage.removeItem(`uccs_draft_${formId}`);
  }
};