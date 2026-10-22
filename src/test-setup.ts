import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// O jsdom não implementa a rolagem da janela
if (typeof window !== 'undefined') window.scrollTo = () => {};
