// import { Navigate } from "react-router-dom";
// import * as React from "react";
//
// export function ProtectedRoute({ children }: { children: React.ReactNode }) {
//     const raw = localStorage.getItem("employee");
//     console.log("ProtectedRoute raw:", raw);
//     const employee = raw ? JSON.parse(raw) : null;
//
//     if (!employee?.isLoggedIn) {
//         return <Navigate to="/" replace />;
//     }
//
//     return children;
// }