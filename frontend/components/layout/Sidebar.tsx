import NavLinks from "./NavLinks";

export default function Sidebar() {
  return (
    <aside className="h-full flex flex-col justify-between py-5 px-3 bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      <div className="">
        <NavLinks />
      </div>

      {/*TODO: Implement user acount information.*/}
      <div>User logo</div>
    </aside>
  );
}
