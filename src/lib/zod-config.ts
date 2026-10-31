import { config } from 'zod';

// Zod 4 uses eval by default, CSP no likey (unsafe-eval)
config({ jitless: true });
