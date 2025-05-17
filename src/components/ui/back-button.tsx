import { ChevronLeft } from 'lucide-react';
import { Button } from './button';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

type Props = {
  Label?: string;
  Href?: string;
};

export default function BackButton({ Label, Href }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    }
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
    <Link to={Href} unstable_viewTransition>
      <Button variant={'outline'} className="shadow" size={'sm'}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        {Label ?? 'Back'}
      </Button>
    </Link>
  );
}
