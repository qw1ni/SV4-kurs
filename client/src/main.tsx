/*
 * ШтатПлан — платформа управления штатным расписанием организации
 * Copyright (c) 2026 Петров М. А. Все права защищены.
 * SPDX-License-Identifier: LicenseRef-StaffPlan-Community-EULA
 * Бесплатное использование в пределах раздела 2 соглашения LICENSE в корне репозитория.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { ru } from 'date-fns/locale';
import { store } from '@/app/store';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
          <App />
        </LocalizationProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
