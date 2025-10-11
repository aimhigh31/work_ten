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
        <IntlProvider locale={i18n} defaultLocale="ko" messages={messages}>
          {children}
        </IntlProvider>
      )}
    </>
  );
}
