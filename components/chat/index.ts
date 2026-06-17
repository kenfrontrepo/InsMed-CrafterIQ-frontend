// Chat components barrel file
// Using direct imports is preferred for bundle optimization (best practice 2.1)
// but this barrel is small and scoped to chat feature only

export { ChatSidebar } from "./chat-sidebar";
export { ChatToggleButtons } from "./chat-toggle-buttons";
export { ChatWelcome } from "./chat-welcome";
export { ChatInput } from "./chat-input";
export { ChatMessage } from "./chat-message";
export { ChatChart } from "./chat-chart";
export { FollowUpQuestions } from "./follow-up-questions";
export { SuggestionCard, type Suggestion } from "./suggestion-card";
export { markdownComponents } from "./markdown-components";