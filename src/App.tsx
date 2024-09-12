import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import HomeTemp from './components/home_temp';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<HomeTemp />} />
    </Route>
  )
);

function App({}) {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
