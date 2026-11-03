import { createContext } from "react";
import { AuthContextType } from "../api/types";

export const AuthContext = createContext<AuthContextType | null>(null);