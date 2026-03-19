import { LogicEditorPage } from '@/components/pages/editor-logic/logic-editor-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/keysets/$keyset/$uuid/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <LogicEditorPage />;
}
