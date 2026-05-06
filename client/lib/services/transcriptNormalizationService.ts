/**
 * Service to clean and normalize GD transcripts
 * Prevents duplicates, merges fragments, and ensures speaker identity accuracy
 */

export interface TranscriptMessage {
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

export const dedupeMessages = (transcript: TranscriptMessage[]): TranscriptMessage[] => {
  if (!transcript || transcript.length <= 1) return transcript;

  const result: TranscriptMessage[] = [];
  
  for (let i = 0; i < transcript.length; i++) {
    const current = transcript[i];
    const prev = result.length > 0 ? result[result.length - 1] : null;

    if (prev) {
      const timeDiff = Math.abs(new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      const normalizedCurrentText = current.text.trim().toLowerCase();
      const normalizedPrevText = prev.text.trim().toLowerCase();

      // Rule: Same speaker + same normalized text + within 3 seconds = remove duplicate
      if (
        current.userId === prev.userId &&
        normalizedCurrentText === normalizedPrevText &&
        timeDiff <= 3
      ) {
        continue;
      }
    }
    
    result.push(current);
  }

  return result;
};

export const mergeFragmentedSpeech = (transcript: TranscriptMessage[]): TranscriptMessage[] => {
  if (!transcript || transcript.length <= 1) return transcript;

  const result: TranscriptMessage[] = [];
  
  for (let i = 0; i < transcript.length; i++) {
    const current = transcript[i];
    const prev = result.length > 0 ? result[result.length - 1] : null;

    if (prev && prev.userId === current.userId) {
      const timeDiff = Math.abs(new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
      
      // Rule: Consecutive same-speaker fragments within 5 seconds = merge
      if (timeDiff <= 5) {
        prev.text = `${prev.text.trim()} ${current.text.trim()}`;
        // Keep the earliest timestamp
        continue;
      }
    }
    
    result.push({ ...current });
  }

  return result;
};

export const normalizeSpeakerNames = (transcript: TranscriptMessage[], participantMap: Record<string, string>): TranscriptMessage[] => {
  return transcript.map(msg => ({
    ...msg,
    userName: participantMap[msg.userId] || msg.userName
  }));
};

export const getCleanTranscript = (transcript: TranscriptMessage[], participantMap: Record<string, string> = {}): TranscriptMessage[] => {
  let cleaned = dedupeMessages(transcript);
  cleaned = mergeFragmentedSpeech(cleaned);
  cleaned = normalizeSpeakerNames(cleaned, participantMap);
  return cleaned;
};
