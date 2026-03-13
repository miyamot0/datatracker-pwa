import { ChevronLeft } from 'lucide-react';
import { Button } from './button';
import { Link, useRouter } from '@tanstack/react-router';

type Props = {
  Label?: string;
  Href?: string;
};

export default function BackButton({ Label, Href }: Props) {
  const { history } = useRouter();

  const handleClick = () => {
    history.go(-1);
  };

  if (!Href) {
    return (
      <Button variant={'outline'} className="shadow" size={'sm'} onClick={handleClick}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {Label ?? 'Back'}
      </Button>
    );
  }

  return (
    <Link to={Href}>
      <Button variant={'outline'} className="shadow" size={'sm'}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {Label ?? 'Back'}
      </Button>
    </Link>
  );
}
