// AI Chat API service for OpenAI compatible endpoint

// ==============================|| API - AI CHAT ||============================== //

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  model?: string;
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: AIMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const AI_ENDPOINT = 'http://localhost:1234/v1/chat/completions';

export async function sendMessageToAI(messages: AIMessage[]): Promise<string> {
  try {
    const requestBody: AIChatRequest = {
      model: 'openai/gpt-oss-20b:2',
      messages,
      temperature: 0.7,
      max_tokens: -1,
      stream: false
    };

    console.log('AI API 요청:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('AI API 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API 에러 응답:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: AIChatResponse = await response.json();
    console.log('AI API 응답 데이터:', data);

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    throw new Error('AI로부터 응답을 받지 못했습니다.');
  } catch (error) {
    console.error('AI API 호출 오류:', error);

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('AI 서버에 연결할 수 없습니다. localhost:1234에서 AI 서버가 실행 중인지 확인해주세요.');
    }

    throw error;
  }
}

// 메시지 순서를 정규화하는 함수 (user/assistant 번갈아가도록)
function normalizeMessageOrder(messages: AIMessage[]): AIMessage[] {
  const normalized: AIMessage[] = [];
  let lastRole: 'user' | 'assistant' | null = null;

  for (const message of messages) {
    if (message.role === 'system') {
      // system 메시지는 그대로 유지
      normalized.push(message);
      continue;
    }

    if (message.role === lastRole) {
      // 같은 role이 연속으로 오는 경우, 마지막 메시지와 병합
      if (normalized.length > 0 && normalized[normalized.length - 1].role === message.role) {
        normalized[normalized.length - 1].content += '\n\n' + message.content;
      }
    } else {
      // 다른 role이면 추가
      normalized.push(message);
      lastRole = message.role as 'user' | 'assistant';
    }
  }

  return normalized;
}

// 대화 컨텍스트를 AIMessage 배열로 변환하는 유틸리티 함수
export function convertMessagesToAIFormat(messages: any[], conversationTitle: string): AIMessage[] {
  const systemMessage: AIMessage = {
    role: 'system',
    content: `당신은 "${conversationTitle}"에 대한 전문적인 AI 어시스턴트입니다. 한국어로 도움이 되는 답변을 제공해주세요.`
  };

  // 초기 메시지들 필터링 (API 요청에서 제외)
  const filteredMessages = messages.filter((message) => !message.isInitial);

  // 메시지가 없으면 시스템 메시지만 반환하지 않음 (에러 방지)
  if (filteredMessages.length === 0) {
    return [
      systemMessage,
      {
        role: 'user',
        content: '안녕하세요!'
      }
    ];
  }

  const formattedMessages: AIMessage[] = [systemMessage];

  filteredMessages.forEach((message) => {
    if (message.from === 'User1') {
      formattedMessages.push({
        role: 'user',
        content: message.text
      });
    } else {
      formattedMessages.push({
        role: 'assistant',
        content: message.text
      });
    }
  });

  // 메시지 순서 정규화
  const normalizedMessages = normalizeMessageOrder(formattedMessages);

  // 마지막 메시지가 user인지 확인, 아니면 에러
  if (normalizedMessages.length > 1 && normalizedMessages[normalizedMessages.length - 1].role !== 'user') {
    throw new Error('마지막 메시지는 사용자 메시지여야 합니다.');
  }

  return normalizedMessages;
}
