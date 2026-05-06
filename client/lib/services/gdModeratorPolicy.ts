/**
 * GD Moderator Policy Engine
 * Defines when and how the AI moderator should intervene
 */

export interface ModeratorState {
  timeLeftSeconds: number;
  totalDurationSeconds: number;
  lastInterventionSecondsAgo: number;
  silenceDurationSeconds: number;
  isTopicDriftDetected: boolean;
  isDominanceDetected: boolean;
  participantCount: number;
}

export enum InterventionType {
  NONE = "none",
  SILENCE_BREAKER = "silence_breaker",
  TOPIC_REDIRECT = "topic_redirect",
  DOMINANCE_REBALANCE = "dominance_rebalance",
  TIME_WARNING = "time_warning",
  CONCLUSION_REQUEST = "conclusion_request",
  FINAL_SUMMARY = "final_summary"
}

export const evaluateModeratorAction = (state: ModeratorState): InterventionType => {
  const { 
    timeLeftSeconds, 
    lastInterventionSecondsAgo, 
    silenceDurationSeconds, 
    isTopicDriftDetected, 
    isDominanceDetected 
  } = state;

  // Rule: Do not intervene too frequently
  if (lastInterventionSecondsAgo < 45 && timeLeftSeconds > 60) {
    return InterventionType.NONE;
  }

  // 1. Critical Time Markers
  if (timeLeftSeconds <= 30) {
    return InterventionType.FINAL_SUMMARY;
  }
  
  if (timeLeftSeconds <= 60 && timeLeftSeconds > 50) {
    return InterventionType.CONCLUSION_REQUEST;
  }

  if (timeLeftSeconds <= 120 && timeLeftSeconds > 110) {
    return InterventionType.TIME_WARNING;
  }

  // 2. Behavioral Triggers (During normal flow)
  
  // Silence > 20 seconds
  if (silenceDurationSeconds > 20) {
    return InterventionType.SILENCE_BREAKER;
  }

  // Topic Drift
  if (isTopicDriftDetected) {
    return InterventionType.TOPIC_REDIRECT;
  }

  // One participant dominance
  if (isDominanceDetected && lastInterventionSecondsAgo > 90) {
    return InterventionType.DOMINANCE_REBALANCE;
  }

  return InterventionType.NONE;
};

export const getModeratorPrompt = (type: InterventionType, context: { topic: string; participantNames: string[] }): string => {
  const { topic, participantNames } = context;
  
  switch (type) {
    case InterventionType.SILENCE_BREAKER:
      return "The discussion has gone quiet. Could someone share their perspective on how this affects the overall goal of " + topic + "?";
    
    case InterventionType.TOPIC_REDIRECT:
      return "Let's try to steer the conversation back to our main topic: " + topic + ". What are your thoughts on the core issues?";
    
    case InterventionType.DOMINANCE_REBALANCE:
      return "We've heard some great points. I'd like to invite others who haven't spoken as much to share their thoughts on " + topic + ".";
    
    case InterventionType.TIME_WARNING:
      return "We have about two minutes remaining. Let's start consolidating our main arguments.";
    
    case InterventionType.CONCLUSION_REQUEST:
      return "One minute left. Please start wrapping up and move towards a final conclusion.";
    
    case InterventionType.FINAL_SUMMARY:
      return "Time is up. Thank you for the insightful discussion. I will now generate the final report based on your contributions.";
    
    default:
      return "";
  }
};
