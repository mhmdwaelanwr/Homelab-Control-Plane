import { RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/providers/AppProviders';
import { appRouter } from '@/router';

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={appRouter} />
    </AppProviders>
  );
}

