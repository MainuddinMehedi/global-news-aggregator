import NavLinks from "./NavLinks";

export default function Sidebar() {
  return (
    <aside className="h-full w-full flex flex-col justify-between py-5 px-2 lg:px-3 bg-sidebar text-sidebar-foreground">
      <div>
        <NavLinks />
      </div>

      {/*TODO: Implement user account information.*/}
      <div className="hidden lg:block text-sidebar-foreground/50 text-xs px-1">
        User logo
      </div>
    </aside>
  );
}
