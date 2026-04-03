import { ChevronLeft } from 'lucide-react';
import { Button } from './button';
import { useRouter } from '@tanstack/react-router';
import { useHotkey } from '@tanstack/react-hotkeys';

type Props = {
  Label?: string;
  Silence?: boolean;
};

export default function BackButton({ Label, Silence }: Props) {
  const { history } = useRouter();

  const handleClick = (silence?: boolean) => {
    if (silence) return;

    history.go(-1);
  };

  // Convenience support for going back with the Escape key
  useHotkey('Escape', () => handleClick(Silence), {
    conflictBehavior: 'replace',
  });

  //if (!Href) {
  return (
    <Button variant={'outline'} className="shadow" size={'sm'} onClick={() => handleClick()}>
      <ChevronLeft className="mr-2 h-4 w-4" />
      {Label ?? 'Back'}
    </Button>
  );
  //}

  /*
  return (
    <Link to={Href}>
      <Button variant={'outline'} className="shadow" size={'sm'}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {Label ?? 'Back'}
      </Button>
    </Link>
  );
  */
}
