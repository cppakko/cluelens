import { useCallback, useEffect, useRef } from 'react';
import type { ComponentProps, FC, ReactNode } from 'react';
import { Button } from './Button';
import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/tailwindUtils';
import { getCommonSettings } from '@/utils/storage';

export interface SpeakerButtonProps extends Omit<ComponentProps<typeof Button>, 'children' | 'onClick'> {
  readonly src: string;
  readonly label?: string;
  readonly icon?: ReactNode;
  readonly onPlay?: () => void;
}

const SpeakerButton: FC<SpeakerButtonProps> = ({
  src,
  label,
  onPlay,
  className,
  size = 'icon',
  ...iconButtonProps
}) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackLabel = label?.trim() || t('speaker.playAudio');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const audio = new Audio();
    audio.preload = 'none';
    audio.src = src;
    audioRef.current = audio;

    getCommonSettings().then((settings) => {
      if (audioRef.current === audio && settings.autoPreloadAudio) {
        audio.preload = 'auto';
        audio.load();
      }
    });

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, [src]);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    audio.play().catch(() => undefined);
    onPlay?.();
  }, [onPlay]);

  return (
    <Button
      variant="ghost"
      size={size}
      {...iconButtonProps}
      aria-label={playbackLabel}
      onClick={handlePlay}
      className={cn(
        'rounded-full text-(--m3-primary) hover:bg-(--m3-primary)/8',
        className,
      )}
    >
      <Volume2 className='size-4' />
    </Button>
  );
};

export default SpeakerButton;
