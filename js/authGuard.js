// Tiny guard for private buyer pages: redirects guests to the login page.
import { requireAuth } from "./auth.js";

requireAuth();
