import { ReactNode, useEffect, useState } from 'react';

// third-party
import { IntlProvider, MessageFormatElement } from 'react-intl';

// project-imports
import useConfig from 'hooks/useConfig';

// types
import { I18n } from 'types/config';

// load locales files
function loadLocaleData(locale: I18n) {
  switch (locale) {
    case 'en':
      return import('utils/locales/en.json');
    case 'vi':
      return import('utils/locales/vi.json');
    case 'sk':
      return import('utils/locales/sk.json');
    case 'ko':
    default:
      return import('utils/locales/ko.json');
  }
}

// ==============================|| LOCALIZATION ||============================== //

interface Props {
  children: ReactNode;
}

export default function Locales({ children }: Props) {
  const { i18n } = useConfig();

  const [messages, setMessages] = useState<Record<string, string> | Record<string, MessageFormatElement[]> | undefined>();

  useEffect(() => {
    loadLocaleData(i18n).then((d: { default: Record<string, string> | Record<string, MessageFormatElement[]> | undefined }) => {
      setMessages(d.default);
    });
  }, [i18n]);

  return (
    <>
      {messages && (
        <IntlProvider
          locale={i18n}
          defaultLocale="ko"
          messages={messages}
          onError={(err) => {
            // ✅ MISSING_TRANSLATION 에러는 조용히 처리 (개발 환경에서만 경고)
            if (err.code === 'MISSING_TRANSLATION') {
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[i18n] 누락된 번역: "${err.descriptor?.id}" (fallback 사용)`);
              }
              return; // 에러를 throw하지 않음
            }
            // 다른 에러는 콘솔에 표시
            console.error('[i18n] 에러:', err);
          }}
        >
          {children}
        </IntlProvider>
      )}
    </>
  );
}
