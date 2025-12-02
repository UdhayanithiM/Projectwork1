export {}; // Makes this a module so global augmentation works

declare global {
  // --- Existing Proofreader definitions ---
  interface ProofreadResult {
    correctedInput: string;
  }
  interface Proofreader {
    proofread(text: string): Promise<ProofreadResult>;
  }

  // --- Existing Rewriter definitions ---
  interface RewriterOptions {
    tone?: 'more-formal' | 'as-is' | 'more-casual';
    length?: 'shorter' | 'as-is' | 'longer';
  }
  interface Rewriter {
    rewrite(text: string, options?: RewriterOptions): Promise<string>;
  }
  
  // --- NEW Summarizer definitions ---
  interface Summarizer {
    summarize(options: { text: string; outputLanguage?: 'en' | 'es' | 'ja' }): Promise<string>;
  }

  // --- Updated Window interface ---
  interface Window {
    Proofreader: typeof Proofreader;
    Rewriter: typeof Rewriter;
    Summarizer: typeof Summarizer; // <-- Add this line
  }

  // --- Existing Global declarations ---
  const Proofreader: {
    create(): Promise<Proofreader>;
    availability(): Promise<'available' | 'downloadable' | 'unavailable'>;
  };

  const Rewriter: {
    create(options?: RewriterOptions): Promise<Rewriter>;
    availability(): Promise<'available' | 'downloadable' | 'unavailable'>;
  };

  // --- NEW Global declaration for Summarizer ---
  const Summarizer: {
    create(): Promise<Summarizer>;
    availability(): Promise<'available' | 'downloadable' | 'unavailable'>;
  };
}



