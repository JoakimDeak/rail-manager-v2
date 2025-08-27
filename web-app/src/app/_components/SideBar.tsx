import { SignOutButton } from './SignOutButton'
import { WorldList } from './WorldList'

export const SideBar = () => {
  return (
    <div className="flex h-full w-fit flex-col items-end justify-start gap-2 p-2">
      <SignOutButton />
      <WorldList />
    </div>
  )
}
