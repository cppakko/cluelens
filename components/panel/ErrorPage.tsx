import { SearchAlert } from 'lucide-react';
import Text from '~/components/ui/Text';
import { useTranslation } from 'react-i18next';

interface ErrorPageProps {
  message?: string;
  compact?: boolean;
}

export default function ErrorPage({ message, compact = false }: ErrorPageProps) {
  const { t } = useTranslation();
  const displayMessage = message || t('error.generic');
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-1 text-(--m3-error)">
        <SearchAlert className='size-5' />
        <Text variant="body2" className="text-(--m3-error)">
          {displayMessage}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 gap-3 text-center">
      <SearchAlert className='size-5' />
      <Text variant="body2" className="text-(--m3-on-surface-variant)">
        {displayMessage}
      </Text>
    </div>
  );
}
