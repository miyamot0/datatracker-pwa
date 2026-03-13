import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/session/$group/$individual/$evaluation/reli',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/session/$group/$individual/$evaluation/reli/"!</div>
}
