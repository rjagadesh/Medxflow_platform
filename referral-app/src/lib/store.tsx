import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Referral, Status, User } from "../types";
import { seedReferrals, USERS } from "../data/mockData";

interface Store {
  referrals: Referral[];
  users: User[];
  updateReferral: (id: number, patch: Partial<Referral>, note?: string) => void;
  moveStatus: (id: number, status: Status, note?: string) => void;
  addUser: (u: Omit<User, "id" | "openCount">) => void;
  updateUser: (id: number, patch: Partial<User>) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [referrals, setReferrals] = useState<Referral[]>(() => seedReferrals());
  const [users, setUsers] = useState<User[]>(() => USERS.map((u) => ({ ...u })));

  function updateReferral(id: number, patch: Partial<Referral>, note?: string) {
    setReferrals((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if (note) {
          next.timeline = [
            ...r.timeline,
            { status: next.status, at: new Date().toISOString(), note, by: "You" },
          ];
        }
        return next;
      })
    );
  }

  function moveStatus(id: number, status: Status, note?: string) {
    setReferrals((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              needsReview: status === "Manual Review" || status === "Pending Review",
              timeline: [
                ...r.timeline,
                { status, at: new Date().toISOString(), note: note || `Moved to ${status}.`, by: "You" },
              ],
            }
          : r
      )
    );
  }

  function addUser(u: Omit<User, "id" | "openCount">) {
    setUsers((us) => [...us, { ...u, id: Math.max(0, ...us.map((x) => x.id)) + 1, openCount: 0 }]);
  }
  function updateUser(id: number, patch: Partial<User>) {
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  const value = useMemo(
    () => ({ referrals, users, updateReferral, moveStatus, addUser, updateUser }),
    [referrals, users]
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
