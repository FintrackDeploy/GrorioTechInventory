import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NAV_ITEMS } from "./navConfig";

export function Sidebar() {
  const { user } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <aside className="blueprint-grid flex h-full w-64 shrink-0 flex-col bg-blueprint-950 text-white">
      {/* Лого */}
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan/30 bg-cyan/10">
            <span className="tag-mono text-[10px] font-semibold text-cyan">GTI</span>
          </div>
          <div>
            <div className="tag-mono text-[10px] uppercase tracking-[0.2em] text-cyan/70">
              Groiro Tech
            </div>
            <div className="text-sm font-semibold leading-tight text-white/90">
              Учёт техники
            </div>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-white/12 text-white shadow-sm"
                      : "text-white/55 hover:bg-white/6 hover:text-white/85",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "tag-mono flex h-6 w-9 shrink-0 items-center justify-center rounded border text-[10px] font-medium tracking-wider transition-all",
                        isActive
                          ? "border-cyan/50 bg-cyan/15 text-cyan"
                          : "border-white/12 text-white/35 group-hover:border-white/25 group-hover:text-white/60",
                      ].join(" ")}
                    >
                      {item.tag}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Футер */}
      <div className="border-t border-white/10 px-5 py-4">
        <div className="tag-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
          Система учёта ИТ-активов
        </div>
        <div className="tag-mono mt-0.5 text-[10px] text-white/40">GTI-INV / v2.0</div>
      </div>
    </aside>
  );
}