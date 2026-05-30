/**
 * js/lib.js — Zentrale externe Bibliotheken
 *
 * EINE React-Instanz für die gesamte App.
 * Alle anderen Dateien importieren React, htm, idb von hier.
 *
 * Verwendung:
 *   import { React, html, useState, useEffect, openDB } from '../lib.js';
 *   import { React, html, useState } from '../../lib.js';
 */

import React from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { openDB as _openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

// htm an UNSERE React-Instanz binden — verhindert Mehrfach-Instanz-Fehler
const html = htm.bind(React.createElement);

// React Hooks als benannte Exporte
const {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
  createContext,
  Fragment,
} = React;

export {
  React,
  html,
  createRoot,
  // Hooks
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
  createContext,
  Fragment,
  // idb (als openDB re-exportiert)
};
export { _openDB as openDB };
