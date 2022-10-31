import { ColorModeScript } from '@chakra-ui/react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container as HTMLElement);
root.render(
  <>
    <ColorModeScript initialColorMode="dark" />
    <App />
  </>
);
