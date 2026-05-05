import { ReactNode } from "react";

export default function ZoomLayout({ children }: { children: ReactNode }) {
  return (
    <div className="zoom-isolated-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {children}
    </div>
  );
}
